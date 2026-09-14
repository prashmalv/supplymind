// ---------------------------------------------------------------------------
// Platform types — multi-tenancy, RBAC, connectors, ingestion, AI contracts.
// Shared between apps/web (UI) and apps/api (NestJS).
// ---------------------------------------------------------------------------

import { Message } from './types';

// ---- RBAC ----------------------------------------------------------------

export type Role = 'platform-admin' | 'org-admin' | 'analyst' | 'viewer';

export const ROLES: Role[] = ['platform-admin', 'org-admin', 'analyst', 'viewer'];

/** Fine-grained permissions; roles map to a set of these. */
export type Permission =
  | 'org:manage'
  | 'org:read'
  | 'user:manage'
  | 'connector:read'
  | 'connector:write'
  | 'sync:run'
  | 'kpi:read'
  | 'ai:chat'
  | 'ai:draft'
  | 'alert:read'
  | 'alert:ack'
  | 'data:export'
  | 'admin:platform';

/** Role → permission set. The API is the source of truth; the UI mirrors it for gating. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'platform-admin': [
    'admin:platform', 'org:manage', 'org:read', 'user:manage',
    'connector:read', 'connector:write', 'sync:run',
    'kpi:read', 'ai:chat', 'ai:draft', 'alert:read', 'alert:ack', 'data:export',
  ],
  'org-admin': [
    'org:manage', 'org:read', 'user:manage',
    'connector:read', 'connector:write', 'sync:run',
    'kpi:read', 'ai:chat', 'ai:draft', 'alert:read', 'alert:ack', 'data:export',
  ],
  'analyst': [
    'org:read', 'connector:read', 'sync:run',
    'kpi:read', 'ai:chat', 'ai:draft', 'alert:read', 'alert:ack', 'data:export',
  ],
  'viewer': [
    'org:read', 'connector:read', 'kpi:read', 'alert:read',
  ],
};

export function roleHasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

// ---- Tenancy / identity --------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  timezone?: string;
  baseCurrency?: string;
  status: 'active' | 'suspended';
  isDemo?: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
}

export interface Membership {
  orgId: string;
  orgName: string;
  role: Role;
}

/** Payload returned by GET /auth/me */
export interface AuthMe {
  user: User;
  memberships: Membership[];
}

/** Response of POST /auth/login and /auth/refresh */
export interface AuthTokens {
  accessToken: string;
  user: User;
  memberships: Membership[];
}

// ---- Connectors ----------------------------------------------------------

export type ConnectorType =
  | 'OBJECT_STORE' // S3 or Azure Blob
  | 'SQL'          // Oracle 19c or Postgres
  | 'DRIVE'        // Google Drive / SharePoint
  | 'SAP_EXTRACT'; // SAP ECC extract files landing in an object store

export type SyncCadence = 'manual' | 'hourly' | 'daily' | 'cron';

export interface ConnectorSummary {
  id: string;
  orgId: string;
  type: ConnectorType;
  name: string;
  status: 'unconfigured' | 'connected' | 'error' | 'syncing';
  lastSyncAt?: string;
  nextSyncAt?: string;
  cadence: SyncCadence;
  createdAt: string;
}

/** Non-secret config; secrets are stored server-side only, never returned. */
export interface ConnectorConfigBase {
  name: string;
  cadence: SyncCadence;
  cronExpr?: string;
}

export interface ObjectStoreConfig extends ConnectorConfigBase {
  provider: 'S3' | 'AZURE_BLOB';
  bucket: string;      // S3 bucket or Blob container
  prefix?: string;
  region?: string;     // S3
  accountName?: string; // Blob
  fileFormat: 'CSV' | 'JSON' | 'PARQUET';
  delimiter?: string;
  hasHeader?: boolean;
}

export interface SqlConfig extends ConnectorConfigBase {
  dialect: 'ORACLE' | 'POSTGRES';
  host: string;
  port: number;
  database?: string;   // PG database
  serviceName?: string; // Oracle service name / SID
  username: string;
  schema?: string;
  sslMode?: string;
}

export interface DriveConfig extends ConnectorConfigBase {
  provider: 'GOOGLE_DRIVE' | 'SHAREPOINT';
  folderId?: string;
  fileTypes?: string[];
}

export interface SapExtractConfig extends ConnectorConfigBase {
  objectStoreConnectorId: string; // which OBJECT_STORE connector holds the drops
  rootPrefix: string;
  // filename→table convention, e.g. "EKKO_YYYYMMDD.csv"
  tablePattern?: string;
}

export type ConnectorConfig =
  | ({ type: 'OBJECT_STORE' } & ObjectStoreConfig)
  | ({ type: 'SQL' } & SqlConfig)
  | ({ type: 'DRIVE' } & DriveConfig)
  | ({ type: 'SAP_EXTRACT' } & SapExtractConfig);

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  objectsFound?: number;
  sampleObjects?: string[];
}

// ---- Ingestion -----------------------------------------------------------

export interface SyncRun {
  id: string;
  connectorId: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  startedAt: string;
  finishedAt?: string;
  rowsIn?: number;
  rowsUpserted?: number;
  rowsRejected?: number;
  error?: string;
}

// ---- AI request/response contracts --------------------------------------

export interface ChatRequest {
  history: Message[];
  message: string;
  image?: { data: string; mimeType: string };
}

export interface ChatResponse {
  text: string;
}

export interface DraftRequest {
  prompt: string;
}

export interface InsightRequest {
  kind: 'chart' | 'kpi' | 'forecast';
  name: string;
  context: unknown;
  value?: unknown;
  trend?: string;
}

export interface AiTextResponse {
  text: string;
}

// ---- AI provider selection (config, non-secret) --------------------------

export type AiProviderId = 'azure-openai' | 'bedrock' | 'gemini' | 'demo';

// ---- Automations (AI assistant "email me when…") -------------------------

export interface Automation {
  id: string;
  title: string;
  condition: string;
  action: string;   // e.g. "email"
  target?: string;  // email address
  active: boolean;
  createdAt: string;
}

export interface CreateAutomationInput {
  title: string;
  condition: string;
  action?: string;
  target?: string;
}

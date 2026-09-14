export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessTtl: string; // e.g. "15m"
    refreshTtlDays: number;
  };
  cookie: {
    secure: boolean;
    domain?: string;
    sameSite: 'lax' | 'strict' | 'none';
  };
  ai: {
    provider: string; // azure-openai | bedrock | gemini | demo
  };
  cloudProvider: string; // azure | aws | local
}

export default (): AppConfig => ({
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-access-secret-change-me',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
  },
  cookie: {
    secure: (process.env.COOKIE_SECURE || 'false') === 'true',
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'demo',
  },
  cloudProvider: process.env.CLOUD_PROVIDER || 'local',
});

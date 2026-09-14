// Re-export shared domain + platform types so existing relative imports
// (`./types`, `../types`) keep working while the source of truth lives in
// @supplymind/shared.
export * from '@supplymind/shared';

// UI-only routing enum stays local to the web app.
export enum View {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  FORECAST = 'FORECAST',
  CHAT = 'CHAT',
  SCENARIO = 'SCENARIO',
  VOICE_AGENT = 'VOICE_AGENT',
  ACTION_CENTER = 'ACTION_CENTER',
}

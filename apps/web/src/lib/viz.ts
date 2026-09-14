// Validated categorical palettes (dataviz skill) for both themes.
// Assign in fixed order, never cycled; a 9th series folds into "Other".
const CATEGORICAL_DARK = [
  '#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767',
];
const CATEGORICAL_LIGHT = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948',
];

// Reserved status palette — always paired with an icon/label, never color-alone.
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

const CHROME_DARK = {
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  textSecondary: '#c3c2b7',
  textPrimary: '#e2e8f0',
  surface: '#0f172a',
};
const CHROME_LIGHT = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  textSecondary: '#52514e',
  textPrimary: '#0b0b0b',
  surface: '#ffffff',
};

export type Theme = 'dark' | 'light';
export const getCategorical = (theme: Theme) => (theme === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT);
export const getChrome = (theme: Theme) => (theme === 'dark' ? CHROME_DARK : CHROME_LIGHT);

// Backwards-compatible dark defaults (used where theme is not threaded).
export const CATEGORICAL = CATEGORICAL_DARK;
export const CHROME = CHROME_DARK;

export function moneyUnit(currency: string): string {
  return currency === 'INR' ? '₹ Cr' : '$M';
}

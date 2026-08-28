// Shared base for text-style <input>/<select> fields — kept in one place so LoginScreen and
// SettingsModal (and anything else that grows one) can't drift apart on the border/background/
// focus styling. Padding is left to the caller since the login page and the settings form
// intentionally use different densities.
export const TEXT_INPUT_CLASS =
  'w-full rounded-lg border border-(--color-line) bg-(--color-panel-soft) text-sm text-(--color-ink) outline-none focus:border-(--color-brand)'

const families: Record<string, string> = {
  Manrope: 'Manrope Variable',
  'IBM Plex Sans': 'IBM Plex Sans',
  Rubik: 'Rubik Variable',
  Unbounded: 'Unbounded Variable',
  'Noto Serif': 'Noto Serif Variable',
  Oswald: 'Oswald Variable',
};

export function editorFontFamily(name?: string) {
  return families[name || 'Manrope'] || families.Manrope;
}

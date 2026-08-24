/** Читает значение CSS custom property из :root — используется при настройке цветов графика (lightweight-charts не понимает var()) */
export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

import { TickMarkType } from 'lightweight-charts'

/**
 * МосБиржа торгует по московскому времени — график должен показывать именно
 * его, а не часовой пояс браузера зрителя (lightweight-charts по умолчанию
 * форматирует время в локальной зоне устройства, из-за чего ось "уезжала"
 * на несколько часов у пользователей не в MSK/UTC).
 */
const MSK_TZ = 'Europe/Moscow'

export function tickMarkFormatter(time: number, tickMarkType: TickMarkType): string {
  const date = new Date(time * 1000)
  switch (tickMarkType) {
    case TickMarkType.Year:
      return date.toLocaleDateString('ru-RU', { timeZone: MSK_TZ, year: 'numeric' })
    case TickMarkType.Month:
      return date.toLocaleDateString('ru-RU', { timeZone: MSK_TZ, month: 'short' })
    case TickMarkType.DayOfMonth:
      return date.toLocaleDateString('ru-RU', { timeZone: MSK_TZ, day: '2-digit', month: 'short' })
    case TickMarkType.TimeWithSeconds:
      return date.toLocaleTimeString('ru-RU', { timeZone: MSK_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    case TickMarkType.Time:
    default:
      return date.toLocaleTimeString('ru-RU', { timeZone: MSK_TZ, hour: '2-digit', minute: '2-digit' })
  }
}

export function crosshairTimeFormatter(time: number): string {
  const date = new Date(time * 1000)
  return `${date.toLocaleDateString('ru-RU', { timeZone: MSK_TZ, day: '2-digit', month: 'short', year: '2-digit' })} ${date.toLocaleTimeString('ru-RU', { timeZone: MSK_TZ, hour: '2-digit', minute: '2-digit' })} МСК`
}

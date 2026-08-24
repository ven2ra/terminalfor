/**
 * У Т-Инвестиций (и других брокеров) по будням стакан и лента сделок живут
 * всю обычную сессию без вопросов — трогать не нужно. А вот по выходным
 * Т-Инвестиции пускают сессию выходного дня (внебиржевые OTC-торги), которых
 * у нашего брокера нет — поэтому по субботам/воскресеньям считаем рынок
 * "живым" только в официальном окне МосБиржи для сессии выходного дня:
 *   00:00–09:50 — биржа закрыта
 *   09:50–10:00 — аукцион открытия
 *   10:00–18:59 — основная сессия
 *   18:59–00:00 — биржа закрыта
 * Вне окна 09:50–18:59 — рынок "заморожен" (последнее известное состояние).
 */
export function isWeekendSessionOpen(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

  const weekday = get('weekday')
  if (weekday !== 'Sat' && weekday !== 'Sun') return true

  const minutesOfDay = Number(get('hour')) * 60 + Number(get('minute'))
  return minutesOfDay >= 9 * 60 + 50 && minutesOfDay < 18 * 60 + 59
}

/**
 * Идут ли сейчас биржевые торги вообще (для индикатора статуса рынка в
 * шапке) — в будни основная+вечерняя сессия МосБиржи 09:50–23:50 МСК,
 * по выходным то же окно сессии выходного дня, что и в isWeekendSessionOpen.
 */
export function isMarketOpenNow(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday')
  const minutesOfDay = Number(get('hour')) * 60 + Number(get('minute'))

  if (weekday === 'Sat' || weekday === 'Sun') {
    return minutesOfDay >= 9 * 60 + 50 && minutesOfDay < 18 * 60 + 59
  }
  return minutesOfDay >= 9 * 60 + 50 && minutesOfDay < 23 * 60 + 50
}

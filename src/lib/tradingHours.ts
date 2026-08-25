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
 * шапке) — в будни утренняя+основная+вечерняя сессии МосБиржи 06:50–23:50
 * МСК, по выходным то же окно сессии выходного дня, что и в isWeekendSessionOpen
 * (у неё нет утренней сессии — только 09:50–18:59).
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
  return minutesOfDay >= 6 * 60 + 50 && minutesOfDay < 23 * 60 + 50
}

// Россия с 2014 года не переходит на летнее время — МСК круглый год UTC+3,
// поэтому для арифметики с датами достаточно фиксированного смещения, без Intl
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000
const WEEKDAY_OPEN_MINUTES = 6 * 60 + 50 // будни — с утренней сессии
const WEEKEND_OPEN_MINUTES = 9 * 60 + 50 // выходные — только сессия выходного дня, без утренней

function openMinutesForWeekday(utcDay: number): number {
  // utcDay 0=вс, 6=сб (см. getUTCDay) — так как mskNow ниже уже сдвинут на смещение МСК,
  // его getUTCDay() отражает день недели именно в московском времени
  return utcDay === 0 || utcDay === 6 ? WEEKEND_OPEN_MINUTES : WEEKDAY_OPEN_MINUTES
}

/**
 * Сколько миллисекунд осталось до следующего открытия торгов — если рынок
 * уже открыт, возвращает 0. Время открытия зависит от дня недели (будни —
 * 06:50, выходные — 09:50), поэтому вычисляется отдельно для "сегодня" и
 * "завтра"; промежуток между закрытием и следующим открытием всегда меньше суток.
 */
export function msUntilMarketOpen(date: Date = new Date()): number {
  const mskNow = new Date(date.getTime() + MSK_OFFSET_MS)
  const minutesOfDay = mskNow.getUTCHours() * 60 + mskNow.getUTCMinutes()
  const todayOpenMinutes = openMinutesForWeekday(mskNow.getUTCDay())
  const daysAhead = minutesOfDay < todayOpenMinutes ? 0 : 1
  const targetOpenMinutes = daysAhead === 0 ? todayOpenMinutes : openMinutesForWeekday((mskNow.getUTCDay() + 1) % 7)
  const nextOpenMsk = Date.UTC(
    mskNow.getUTCFullYear(),
    mskNow.getUTCMonth(),
    mskNow.getUTCDate() + daysAhead,
    Math.floor(targetOpenMinutes / 60),
    targetOpenMinutes % 60,
    0,
    0
  )
  return Math.max(0, nextOpenMsk - MSK_OFFSET_MS - date.getTime())
}

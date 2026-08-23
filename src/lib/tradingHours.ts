/**
 * У Т-Инвестиций (и других брокеров) по будням стакан живёт всю обычную
 * сессию без вопросов — трогать не нужно. А вот по выходным Т-Инвестиции
 * пускают внебиржевые (OTC) торги, которых у нашего брокера нет — поэтому
 * по субботам/воскресеньям стакан считаем "живым" только в окне 09:50–19:00
 * МСК, вне его — замороженным (последнее известное состояние, без опроса).
 */
export function isOrderBookOpen(date: Date = new Date()): boolean {
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
  return minutesOfDay >= 9 * 60 + 50 && minutesOfDay < 19 * 60
}

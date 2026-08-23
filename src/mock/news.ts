import { NewsItem } from '@/types'

export const INITIAL_NEWS: NewsItem[] = [
  { id: 'n1', title: 'Банк России сохранил ключевую ставку на уровне 21%', source: 'ЦБ РФ', time: Date.now() - 1000 * 60 * 4, tag: 'macro', important: true },
  { id: 'n2', title: 'Сбербанк отчитался о рекордной чистой прибыли по РСБУ', source: 'Интерфакс', time: Date.now() - 1000 * 60 * 22, tag: 'company' },
  { id: 'n3', title: 'Нефть Brent превысила $84 за баррель на фоне сокращения поставок', source: 'Reuters', time: Date.now() - 1000 * 60 * 41, tag: 'market' },
  { id: 'n4', title: 'Bitcoin обновил месячный максимум, объёмы торгов выросли на 18%', source: 'CoinDesk', time: Date.now() - 1000 * 60 * 58, tag: 'crypto' },
  { id: 'n5', title: 'Газпром объявил дату закрытия реестра по дивидендам', source: 'МосБиржа', time: Date.now() - 1000 * 60 * 75, tag: 'company', important: true },
  { id: 'n6', title: 'Индекс МосБиржи закрыл торги в плюсе на фоне позитива с сырьевых рынков', source: 'РБК', time: Date.now() - 1000 * 60 * 96, tag: 'market' },
  { id: 'n7', title: 'Инфляция в РФ замедлилась до 7,4% в годовом выражении', source: 'Росстат', time: Date.now() - 1000 * 60 * 130, tag: 'macro' },
  { id: 'n8', title: 'Яндекс представил обновлённую стратегию развития до 2027 года', source: 'Ведомости', time: Date.now() - 1000 * 60 * 160, tag: 'company' },
]

const HEADLINES: Array<{ title: string; source: string; tag: NewsItem['tag'] }> = [
  { title: 'Лукойл увеличил инвестиции в нефтепереработку', source: 'Коммерсантъ', tag: 'company' },
  { title: 'Доллар укрепился к рублю на фоне налогового периода', source: 'Финам', tag: 'macro' },
  { title: 'Ethereum готовится к очередному сетевому обновлению', source: 'CoinDesk', tag: 'crypto' },
  { title: 'Норникель объявил о планах по модернизации Талнахской фабрики', source: 'Интерфакс', tag: 'company' },
  { title: 'Мировые рынки акций растут на ожиданиях снижения ставок ФРС', source: 'Bloomberg', tag: 'market' },
]

/** Генерирует одну случайную новость для периодического пополнения ленты */
export function generateRandomNews(): NewsItem {
  const h = HEADLINES[Math.floor(Math.random() * HEADLINES.length)]
  return { id: `n-${Date.now()}`, title: h.title, source: h.source, tag: h.tag, time: Date.now() }
}

const NAMED_ENTITIES = {
  nbsp: ' ',
  quot: '"',
  apos: "'",
  amp: '&',
  lt: '<',
  gt: '>',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
}

/** Убирает HTML-разметку из фрагмента, сохраняя читаемые пробелы между блоками */
export function stripHtml(text) {
  return String(text ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    // Числовые сущности (&#39; десятичная, &#x27; шестнадцатеричная) — RSS/Telegram
    // отдают через них практически любой не-ASCII символ (кавычки, доллар,
    // тире), не только "экзотику". Именованные (&amp; и т.п.) — отдельным
    // словарём: &amp; должен разворачиваться ПОСЛЕДНИМ, иначе "&amp;lt;" даст
    // невалидный повторно-декодированный "<"
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(nbsp|quot|apos|lt|gt|laquo|raquo|mdash|ndash|hellip);/g, (_, name) => NAMED_ENTITIES[name])
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

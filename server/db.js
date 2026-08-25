/**
 * Демо-счёт (баланс/маржа) и стартовые позиции портфеля — раньше жили как
 * захардкоженные константы в коде фронтенда (src/mock/portfolio.ts), любое
 * изменение требовало правки кода и передеплоя. Теперь это SQLite-файл на
 * персистентном volume (тот же /app/data, что и у server/bondDefaults.js) —
 * значения правятся прямо в базе, без пуша.
 */
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? './data/terminalfor.db'
mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL,
    equity REAL NOT NULL,
    available_margin REAL NOT NULL,
    used_margin REAL NOT NULL,
    today_pnl REAL NOT NULL,
    today_pnl_percent REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS position_seeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    size REAL NOT NULL,
    offset_percent REAL NOT NULL
  );
`)

// Значения, которые раньше были в src/mock/portfolio.ts — используются
// только чтобы засеять пустую базу при самом первом запуске
const DEFAULT_ACCOUNT = {
  balance: 1_248_930.5,
  equity: 1_262_410.2,
  available_margin: 890_150.0,
  used_margin: 358_780.5,
  today_pnl: 13_479.7,
  today_pnl_percent: 1.08,
}

const DEFAULT_POSITION_SEEDS = [
  { ticker: 'SBER', side: 'buy', size: 1200, offset_percent: -2.9 },
  { ticker: 'LKOH', side: 'buy', size: 20, offset_percent: -2.4 },
  { ticker: 'GAZP', side: 'sell', size: 800, offset_percent: 2.5 },
  { ticker: 'ROSN', side: 'buy', size: 150, offset_percent: -4.6 },
]

if (db.prepare('SELECT COUNT(*) AS c FROM account').get().c === 0) {
  db.prepare(
    `INSERT INTO account (id, balance, equity, available_margin, used_margin, today_pnl, today_pnl_percent)
     VALUES (1, @balance, @equity, @available_margin, @used_margin, @today_pnl, @today_pnl_percent)`
  ).run(DEFAULT_ACCOUNT)
}

if (db.prepare('SELECT COUNT(*) AS c FROM position_seeds').get().c === 0) {
  const insert = db.prepare(
    'INSERT INTO position_seeds (ticker, side, size, offset_percent) VALUES (@ticker, @side, @size, @offset_percent)'
  )
  db.transaction((rows) => rows.forEach((r) => insert.run(r)))(DEFAULT_POSITION_SEEDS)
}

function rowToAccount(row) {
  return {
    balance: row.balance,
    equity: row.equity,
    availableMargin: row.available_margin,
    usedMargin: row.used_margin,
    todayPnl: row.today_pnl,
    todayPnlPercent: row.today_pnl_percent,
  }
}

export function getAccount() {
  return rowToAccount(db.prepare('SELECT * FROM account WHERE id = 1').get())
}

// camelCase (AccountSummary, см. src/types/index.ts) → колонка в таблице
const ACCOUNT_FIELDS = {
  balance: 'balance',
  equity: 'equity',
  availableMargin: 'available_margin',
  usedMargin: 'used_margin',
  todayPnl: 'today_pnl',
  todayPnlPercent: 'today_pnl_percent',
}

/** Частичное обновление счёта — принимает поля AccountSummary, пишет только переданные числовые */
export function updateAccount(patch) {
  const entries = Object.entries(patch ?? {}).filter(([key, value]) => key in ACCOUNT_FIELDS && Number.isFinite(value))
  if (entries.length === 0) return getAccount()

  const setClause = entries.map(([key]) => `${ACCOUNT_FIELDS[key]} = @${key}`).join(', ')
  db.prepare(`UPDATE account SET ${setClause} WHERE id = 1`).run(Object.fromEntries(entries))
  return getAccount()
}

export function getPositionSeeds() {
  return db.prepare('SELECT ticker, side, size, offset_percent AS offsetPercent FROM position_seeds ORDER BY id').all()
}

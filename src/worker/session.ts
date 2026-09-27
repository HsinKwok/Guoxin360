/**
 * 会话世代（epoch）：让无状态令牌具备服务端主动失效能力。
 *
 * 令牌里带上签发时的世代号，校验时必须与库里当前值一致；
 * 登出时把世代号 +1，此前签发的所有令牌立即作废（不用等 7 天 TTL）。
 */

import { readJsonValue } from './db'

const EPOCH_KEY = 'admin_session_epoch'

/** 读当前世代号；从未记录过时按 0 处理。 */
export async function loadSessionEpoch(db: D1Database): Promise<number> {
  const value = await readJsonValue<unknown>(db, 'settings', EPOCH_KEY)
  return typeof value === 'number' && Number.isInteger(value) ? value : 0
}

/**
 * 世代号 +1 并落库。
 *
 * 用一条 UPSERT 在 SQL 里自增，避免「先读后写」在并发登出时丢失一次自增
 * （两个请求各自读到 n，都写回 n+1，实际只加了一次）。
 * 值以数字文本存储，读取端 JSON.parse 后仍是数字；非法存量值按 0 起算。
 */
export async function bumpSessionEpoch(db: D1Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?1, '1', ?2)
       ON CONFLICT(key) DO UPDATE SET
         value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
         updated_at = ?2`,
    )
    .bind(EPOCH_KEY, new Date().toISOString())
    .run()
}

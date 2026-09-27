/**
 * 会话世代（epoch）：让无状态令牌具备服务端主动失效能力。
 *
 * 令牌里带上签发时的世代号，校验时必须与库里当前值一致；
 * 登出时把世代号 +1，此前签发的所有令牌立即作废（不用等 7 天 TTL）。
 */

import { readJsonValue, upsertJson } from './db'

const EPOCH_KEY = 'admin_session_epoch'

/** 读当前世代号；从未记录过时按 0 处理。 */
export async function loadSessionEpoch(db: D1Database): Promise<number> {
  const value = await readJsonValue<unknown>(db, 'settings', EPOCH_KEY)
  return typeof value === 'number' && Number.isInteger(value) ? value : 0
}

/** 世代号 +1 并落库，返回新值。 */
export async function bumpSessionEpoch(db: D1Database): Promise<number> {
  const next = (await loadSessionEpoch(db)) + 1
  await upsertJson(db, 'settings', EPOCH_KEY, next)
  return next
}

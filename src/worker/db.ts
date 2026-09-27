/**
 * D1 小工具：content 与 settings 两张表结构一致（key / value / updated_at），
 * 写入都用同一条 UPSERT。
 */

type JsonTable = 'content' | 'settings'

/** 按 key 覆盖写入 JSON，不存在则插入。表名只接受内置白名单，不来自外部输入。 */
export async function upsertJson(
  db: D1Database,
  table: JsonTable,
  key: string,
  value: unknown,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ${table} (key, value, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3`,
    )
    .bind(key, JSON.stringify(value), new Date().toISOString())
    .run()
}

/** 按 key 删除一行；表名同样只接受内置白名单。 */
export async function deleteKey(db: D1Database, table: JsonTable, key: string): Promise<void> {
  await db.prepare(`DELETE FROM ${table} WHERE key = ?1`).bind(key).run()
}

/** 按 key 读取 JSON；不存在或内容损坏时返回 null，由调用方决定兜底值。 */
export async function readJsonValue<T>(
  db: D1Database,
  table: JsonTable,
  key: string,
): Promise<T | null> {
  const row = await db
    .prepare(`SELECT value FROM ${table} WHERE key = ?1`)
    .bind(key)
    .first<{ value: string }>()
  if (!row) return null

  try {
    return JSON.parse(row.value) as T
  } catch {
    return null
  }
}

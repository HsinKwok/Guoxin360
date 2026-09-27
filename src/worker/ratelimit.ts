/**
 * 基于 D1 的固定窗口限流。
 *
 * 登录、留言这类公开接口需要限制单 IP 的频率：前者防暴力破解，后者防垃圾邮件刷发信。
 * 计数落在 D1 而不是进程内存里 —— Worker 会在多个 isolate / 边缘节点上运行，
 * 内存计数跨实例不共享，也会随实例回收而丢失。
 */

export interface RateLimitRule {
  /** 窗口长度（秒） */
  windowSeconds: number
  /** 窗口内允许的最大请求数 */
  max: number
}

export interface RateLimitResult {
  allowed: boolean
  /** 触发限流时建议的等待秒数，用于 Retry-After 响应头 */
  retryAfterSeconds: number
}

/** 已就非法配置告警过的变量名，避免每个请求都刷一条日志。 */
const warnedRules = new Set<string>()

/**
 * 解析 `最大次数/窗口秒数` 形式的环境变量（如 `10/900`）。
 * 未设置或格式非法时回退内置默认值；非法时告警一次，避免线上配错却静默失效。
 */
export function parseRateLimitRule(
  raw: string | undefined,
  fallback: RateLimitRule,
  name: string,
): RateLimitRule {
  if (!raw) return fallback

  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(raw.trim())
  const max = match ? Number(match[1]) : 0
  const windowSeconds = match ? Number(match[2]) : 0

  if (max <= 0 || windowSeconds <= 0) {
    if (!warnedRules.has(name)) {
      warnedRules.add(name)
      console.error(`[ratelimit] ${name} 配置非法（应为 次数/秒数，如 10/900），已回退默认值`, raw)
    }
    return fallback
  }

  return { max, windowSeconds }
}

/** 取客户端 IP；Cloudflare 会在边缘注入 CF-Connecting-IP。 */
export function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/**
 * 记一次请求并返回是否放行。
 *
 * 数据库异常时放行（fail-open）：限流只是纵深防御，不该因计数表故障把正常用户挡在门外。
 */
export async function consumeRateLimit(
  db: D1Database,
  bucket: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const resetAt = now + rule.windowSeconds

  try {
    // 同一条 UPSERT 完成「进窗口则 +1、已过期则重置」，避免读改写之间的竞态
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count    = CASE WHEN reset_at <= ?3 THEN 1 ELSE count + 1 END,
           reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END
         RETURNING count, reset_at`,
      )
      .bind(bucket, resetAt, now)
      .first<{ count: number; reset_at: number }>()

    if (!row) return { allowed: true, retryAfterSeconds: 0 }

    // 顺带清理过期计数，避免表无限增长；概率触发以摊薄每次请求的开销
    if (Math.random() < 0.01) {
      await db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?1').bind(now).run()
    }

    return {
      allowed: row.count <= rule.max,
      retryAfterSeconds: Math.max(1, row.reset_at - now),
    }
  } catch (error) {
    console.error('[ratelimit] 计数失败，已放行', bucket, error)
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

/** Worker 里几个重复用到的 HTTP 小工具。 */

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    // 接口一律不缓存：/api/admin/* 与 /api/auth/session 带会话状态，避免浏览器启发式缓存返回过期结果
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

/** 解析 JSON 请求体；失败时返回可直接回给客户端的 400 响应。 */
export async function readJson(request: Request): Promise<{ value: unknown } | { error: Response }> {
  try {
    return { value: await request.json() }
  } catch {
    return { error: json({ ok: false, error: '请求体不是合法的 JSON' }, 400) }
  }
}

/** 读 Cookie 中某个字段的值，不存在返回 null。 */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null

  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim()
  }
  return null
}

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  const parts = [`${name}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${options.maxAge}`]
  // 本地 http 开发时不加 Secure，否则浏览器可能直接丢弃这个 Cookie
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}

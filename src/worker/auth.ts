/**
 * 后台鉴权：密码校验 + HMAC-SHA256 签名的会话 Cookie。
 *
 * 密码来自 Worker secret（ADMIN_PASSWORD），不落库；
 * 会话令牌是「过期时间戳.会话世代 + 签名」，服务端只存一个世代号
 * （见 session.ts），既能无状态校验，又能在登出时立即作废旧令牌。
 */

export const SESSION_COOKIE = 'gx_admin'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))
}

/** 逐字节比较，避免用 === 比较签名时泄漏时序信息 */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i]
  return diff === 0
}

/** 先各自摘要再比较，长度一致，也不会因为提前返回泄漏密码前缀 */
export async function verifyPassword(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(input), sha256(expected)])
  return equalBytes(a, b)
}

export async function createSessionToken(secret: string, epoch: number): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${expiresAt}.${epoch}`
  return `${payload}.${toBase64Url(await hmac(secret, payload))}`
}

export async function isSessionValid(
  secret: string,
  epoch: number,
  token: string | null,
): Promise<boolean> {
  if (!token) return false

  const index = token.lastIndexOf('.')
  if (index === -1) return false

  const payload = token.slice(0, index)
  let signature: Uint8Array
  try {
    signature = fromBase64Url(token.slice(index + 1))
  } catch {
    return false
  }

  if (!equalBytes(signature, await hmac(secret, payload))) return false

  // payload 形如「过期时间戳.会话世代」；两段都必须合法且世代与库里一致
  const [rawExpiresAt, rawEpoch] = payload.split('.')
  const expiresAt = Number(rawExpiresAt)
  const tokenEpoch = Number(rawEpoch)

  return (
    Number.isInteger(expiresAt) &&
    expiresAt > Math.floor(Date.now() / 1000) &&
    Number.isInteger(tokenEpoch) &&
    tokenEpoch === epoch
  )
}

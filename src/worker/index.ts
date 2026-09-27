/**
 * Cloudflare Worker 入口。
 *
 * 静态资源由 Workers Assets 提供，路由由 wrangler.jsonc 的 assets 配置决定：
 * - `run_worker_first: ["/api/*"]`：只有 /api/* 会先交给这里的 Worker；
 * - 其余请求先匹配静态资源，未匹配到的导航请求由
 *   `not_found_handling: "single-page-application"` 回退到 index.html，
 *   使 React Router 的客户端路由（/about、/projects 等）可直接访问。
 *
 * 后台（/admin）和前台共用一个 Worker：后台只是调用下面的 /api/admin/* 接口。
 */

import { isContentSection, sectionLabels } from '../data/defaults'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isSessionValid,
  verifyPassword,
} from './auth'
import { loadContent, matchesSectionShape, resetSection, saveSection } from './content'
import { json, readCookie, readJson, serializeCookie } from './http'
import {
  isMailReady,
  loadMailSettings,
  parseMailInput,
  saveMailSettings,
  sendContactMail,
  toMailSettingsView,
} from './mail'
import { clientIp, consumeRateLimit, parseRateLimitRule } from './ratelimit'
import { bumpSessionEpoch, loadSessionEpoch } from './session'

export interface Env {
  DB: D1Database
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
  /** 留言收件邮箱（wrangler.jsonc 的 vars 或 secret），为空时 /api/contact 直接报错 */
  CONTACT_TO?: string
  /** 仅本地 `.dev.vars` 里设为 development；线上不设（缺省按生产处理） */
  ENVIRONMENT?: string
  /** 登录限流阈值，格式「最大次数/窗口秒数」（如 `10/900`）；缺省用内置默认值 */
  LOGIN_RATE_LIMIT?: string
  /** 留言限流阈值，格式「最大次数/窗口秒数」（如 `5/3600`）；缺省用内置默认值 */
  CONTACT_RATE_LIMIT?: string
}

interface ContactPayload {
  name?: unknown
  email?: unknown
  message?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADMIN_CONTENT_PATH = '/api/admin/content'
const ADMIN_MAIL_PATH = '/api/admin/mail'

/**
 * 公开接口限流的默认阈值：登录防暴力破解，留言防垃圾邮件刷发信（按客户端 IP 计数）。
 * 可分别用环境变量 LOGIN_RATE_LIMIT / CONTACT_RATE_LIMIT 覆盖（格式「次数/秒数」）。
 */
const DEFAULT_LOGIN_RATE_LIMIT = { windowSeconds: 15 * 60, max: 10 }
const DEFAULT_CONTACT_RATE_LIMIT = { windowSeconds: 60 * 60, max: 5 }

/** 示例 / 占位凭据：一旦出现在非开发环境，说明忘了用 wrangler secret put 覆盖 */
const PLACEHOLDER_CREDENTIALS = [
  'admin123456',
  'dev-only-session-secret-please-change',
  'change-me-admin-password',
  'change-me-session-secret',
]

function methodNotAllowed(): Response {
  return json({ ok: false, error: 'Method Not Allowed' }, 405)
}

function tooManyRequests(retryAfterSeconds: number): Response {
  return json({ ok: false, error: '请求过于频繁，请稍后再试' }, 429, {
    'retry-after': String(retryAfterSeconds),
  })
}

/**
 * 非开发环境仍在使用内置示例凭据时为 true。
 * 示例密钥写在仓库里、等同于公开值，所以「登录」和「会话校验」都要拦：
 * 只拦登录的话，攻击者仍可用公开的占位密钥伪造出签名合法的会话令牌。
 */
function usingPlaceholderCredentials(env: Env): boolean {
  if (env.ENVIRONMENT === 'development') return false
  return [env.ADMIN_PASSWORD, env.SESSION_SECRET].some((value) =>
    PLACEHOLDER_CREDENTIALS.includes(value ?? ''),
  )
}

/** 请求是否携带有效会话；缺 SESSION_SECRET 或仍在用示例凭据时一律视为未登录 */
async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  if (!env.SESSION_SECRET || usingPlaceholderCredentials(env)) return false
  return isSessionValid(
    env.SESSION_SECRET,
    await loadSessionEpoch(env.DB),
    readCookie(request, SESSION_COOKIE),
  )
}

/** 未登录时返回 401 响应，已登录返回 null */
async function denyIfNotLoggedIn(request: Request, env: Env): Promise<Response | null> {
  if (!env.SESSION_SECRET) {
    return json({ ok: false, error: '服务端未配置 SESSION_SECRET' }, 500)
  }
  if (await isAuthenticated(request, env)) return null
  return json({ ok: false, error: '登录状态已失效，请重新登录' }, 401)
}

function setSessionCookie(request: Request, token: string, maxAge: number): Record<string, string> {
  return {
    'set-cookie': serializeCookie(SESSION_COOKIE, token, {
      maxAge,
      secure: new URL(request.url).protocol === 'https:',
    }),
  }
}

/** 统一的「返回最新整站内容」响应：读取整站内容与保存/重置后的返回都走这里。 */
async function contentResponse(env: Env): Promise<Response> {
  return json({ ok: true, content: await loadContent(env.DB) })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') {
      return json({ ok: true, service: 'guoxin360', time: new Date().toISOString() })
    }

    // 前台读取整站内容（公开）
    if (pathname === '/api/content') {
      if (request.method !== 'GET') return methodNotAllowed()
      return contentResponse(env)
    }

    if (pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return methodNotAllowed()
      }

      const contactRule = parseRateLimitRule(
        env.CONTACT_RATE_LIMIT,
        DEFAULT_CONTACT_RATE_LIMIT,
        'CONTACT_RATE_LIMIT',
      )
      const limit = await consumeRateLimit(env.DB, `contact:${clientIp(request)}`, contactRule)
      if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds)

      const body = await readJson(request)
      if ('error' in body) return body.error
      const payload = body.value as ContactPayload

      const name = typeof payload.name === 'string' ? payload.name.trim() : ''
      const email = typeof payload.email === 'string' ? payload.email.trim() : ''
      const message = typeof payload.message === 'string' ? payload.message.trim() : ''

      if (!name || !email || !message) {
        return json({ ok: false, error: '姓名、邮箱和留言内容均为必填' }, 400)
      }
      if (!EMAIL_RE.test(email)) {
        return json({ ok: false, error: '邮箱格式不正确' }, 400)
      }
      if (message.length > 2000) {
        return json({ ok: false, error: '留言内容请控制在 2000 字以内' }, 400)
      }

      // 真正把留言发到 CONTACT_TO；SMTP 参数由后台「邮件设置」维护。
      const to = (env.CONTACT_TO ?? '').trim()
      const settings = await loadMailSettings(env.DB)

      if (!isMailReady(settings, to)) {
        console.error('[contact] 邮件服务尚未配置完整，留言未发送')
        return json({ ok: false, error: '邮件服务尚未配置，请稍后再试' }, 503)
      }

      try {
        await sendContactMail(settings, to, { name, email, message })
      } catch (error) {
        console.error('[contact] 发送失败', error)
        return json({ ok: false, error: '留言发送失败，请稍后再试' }, 502)
      }

      return json({ ok: true })
    }

    // ---- 后台鉴权 ----

    if (pathname === '/api/auth/session') {
      return json({ ok: true, authenticated: await isAuthenticated(request, env) })
    }

    if (pathname === '/api/auth/login') {
      if (request.method !== 'POST') return methodNotAllowed()

      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
        return json({ ok: false, error: '服务端未配置 ADMIN_PASSWORD / SESSION_SECRET' }, 500)
      }

      // fail-safe：只有本地开发可以继续用示例凭据，其它环境一律拒绝
      if (usingPlaceholderCredentials(env)) {
        console.error('[auth] 非开发环境检测到示例占位凭据，已拒绝登录')
        return json(
          { ok: false, error: '服务端仍在使用示例密钥，请用 wrangler secret put 覆盖后再登录' },
          500,
        )
      }

      // 限流放在密码校验之前：既挡住暴力破解，也避免每次尝试都跑一遍密码哈希
      const loginRule = parseRateLimitRule(
        env.LOGIN_RATE_LIMIT,
        DEFAULT_LOGIN_RATE_LIMIT,
        'LOGIN_RATE_LIMIT',
      )
      const limit = await consumeRateLimit(env.DB, `login:${clientIp(request)}`, loginRule)
      if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds)

      const body = await readJson(request)
      if ('error' in body) return body.error
      const payload = body.value as { password?: unknown }

      const password = typeof payload.password === 'string' ? payload.password : ''
      if (!password || !(await verifyPassword(password, env.ADMIN_PASSWORD))) {
        return json({ ok: false, error: '密码不正确' }, 401)
      }

      const epoch = await loadSessionEpoch(env.DB)
      const token = await createSessionToken(env.SESSION_SECRET, epoch)
      return json({ ok: true }, 200, setSessionCookie(request, token, SESSION_TTL_SECONDS))
    }

    if (pathname === '/api/auth/logout') {
      if (request.method !== 'POST') return methodNotAllowed()
      // 世代 +1：不依赖 Cookie 过期，服务端立即作废所有已签发的令牌
      await bumpSessionEpoch(env.DB)
      return json({ ok: true }, 200, setSessionCookie(request, '', 0))
    }

    // ---- 后台内容读写 ----

    if (pathname === ADMIN_CONTENT_PATH || pathname.startsWith(`${ADMIN_CONTENT_PATH}/`)) {
      const denied = await denyIfNotLoggedIn(request, env)
      if (denied) return denied

      const section = pathname.slice(ADMIN_CONTENT_PATH.length).replace(/^\//, '')

      // GET /api/admin/content 返回全部内容（含未改动分区），供后台初始化
      if (!section) {
        if (request.method !== 'GET') return methodNotAllowed()
        return contentResponse(env)
      }

      if (!isContentSection(section)) {
        return json({ ok: false, error: '未知的内容分区' }, 404)
      }

      if (request.method === 'PUT') {
        const body = await readJson(request)
        if ('error' in body) return body.error
        const value = body.value

        // 分区形态以默认值为准：不仅限于数组 / 对象，对象分区的字段也必须齐全
        if (!matchesSectionShape(section, value)) {
          return json({ ok: false, error: `${sectionLabels[section]} 的数据结构不正确` }, 400)
        }

        await saveSection(env.DB, section, value)
        return contentResponse(env)
      }

      if (request.method === 'DELETE') {
        await resetSection(env.DB, section)
        return contentResponse(env)
      }

      return methodNotAllowed()
    }

    // ---- 后台邮件设置 ----

    if (pathname === ADMIN_MAIL_PATH) {
      const denied = await denyIfNotLoggedIn(request, env)
      if (denied) return denied

      if (request.method === 'GET') {
        return json({ ok: true, mail: toMailSettingsView(await loadMailSettings(env.DB)) })
      }

      if (request.method === 'PUT') {
        const body = await readJson(request)
        if ('error' in body) return body.error

        const parsed = parseMailInput(body.value, await loadMailSettings(env.DB))
        if ('error' in parsed) return json({ ok: false, error: parsed.error }, 400)

        await saveMailSettings(env.DB, parsed.value)
        return json({ ok: true, mail: toMailSettingsView(parsed.value) })
      }

      return methodNotAllowed()
    }

    return json({ ok: false, error: 'Not Found' }, 404)
  },
}

/**
 * 留言邮件：SMTP 配置读写（D1 的 settings 表）+ 通过 worker-mailer 发信。
 *
 * Cloudflare Workers 不允许连 25 端口，所以只用 465（隐式 TLS）或 587（STARTTLS）。
 */

import { WorkerMailer } from 'worker-mailer'
import {
  emptyMailSettings,
  type MailSettingsView,
  type StoredMailSettings,
} from '../data/mail'
import { readJsonValue, upsertJson } from './db'

const MAIL_KEY = 'mail'

export async function loadMailSettings(db: D1Database): Promise<StoredMailSettings> {
  const stored = await readJsonValue<Partial<StoredMailSettings>>(db, 'settings', MAIL_KEY)
  return { ...emptyMailSettings, ...(stored ?? {}) }
}

export async function saveMailSettings(db: D1Database, value: StoredMailSettings): Promise<void> {
  await upsertJson(db, 'settings', MAIL_KEY, value)
}

/** 后台用的视图：抹掉密码，只保留「是否已设置」。 */
export function toMailSettingsView(settings: StoredMailSettings): MailSettingsView {
  const { password, ...rest } = settings
  return { ...rest, passwordSet: password !== '' }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 校验后台提交的 SMTP 配置。
 * 密码留空表示「沿用已保存的密码」，这样后台回显不必把密码明文送到浏览器。
 */
export function parseMailInput(
  input: unknown,
  current: StoredMailSettings,
): { error: string } | { value: StoredMailSettings } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { error: '邮件设置的数据结构不正确' }
  }

  const raw = input as Record<string, unknown>
  const host = readString(raw.host)
  const username = readString(raw.username)
  const fromEmail = readString(raw.fromEmail)

  if (!host || !username || !fromEmail) {
    return { error: 'SMTP 服务器地址、用户名和发件邮箱均为必填' }
  }

  const port = readString(raw.port)
  const portNumber = Number(port)
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    return { error: 'SMTP 端口需为 1 - 65535 之间的整数' }
  }

  const password = typeof raw.password === 'string' && raw.password !== '' ? raw.password : current.password

  return {
    value: {
      host,
      port,
      secure: raw.secure === true,
      username,
      password,
      fromName: readString(raw.fromName),
      fromEmail,
    },
  }
}

export interface ContactMessage {
  name: string
  email: string
  message: string
}

/** 收件地址来自环境变量，其余来自后台配置；缺一项都不能发信。 */
export function isMailReady(settings: StoredMailSettings, to: string): boolean {
  return Boolean(settings.host && settings.username && settings.password && settings.fromEmail && to)
}

export async function sendContactMail(
  settings: StoredMailSettings,
  to: string,
  contact: ContactMessage,
): Promise<void> {
  const from = settings.fromName
    ? { name: settings.fromName, email: settings.fromEmail }
    : settings.fromEmail

  await WorkerMailer.send(
    {
      host: settings.host,
      port: Number(settings.port),
      secure: settings.secure,
      startTls: !settings.secure,
      credentials: { username: settings.username, password: settings.password },
      authType: ['plain', 'login'],
    },
    {
      from,
      to,
      // 直接回复这封通知即可回到访客邮箱（不给访客发确认邮件）
      reply: { name: contact.name, email: contact.email },
      subject: `站点留言：${contact.name.replace(/[\r\n]+/g, ' ')}`,
      text: `姓名：${contact.name}\n邮箱：${contact.email}\n\n${contact.message}`,
      html: [
        `<p><strong>姓名：</strong>${escapeHtml(contact.name)}</p>`,
        `<p><strong>邮箱：</strong>${escapeHtml(contact.email)}</p>`,
        '<p><strong>留言：</strong></p>',
        `<p>${escapeHtml(contact.message).replace(/\n/g, '<br>')}</p>`,
      ].join('\n'),
    },
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

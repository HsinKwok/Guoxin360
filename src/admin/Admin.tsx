/**
 * 后台管理页（/admin）。
 *
 * 与前台同一个 Worker：这里只调用 /api/auth/* 与 /api/admin/content/*。
 * 未登录时先显示密码表单；登录后按分区加载内容，逐区保存或恢复默认。
 */

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  contentSections,
  sectionLabels,
  type ContentSection,
  type SiteContent,
} from '../data/defaults'
import type { MailSettingsView } from '../data/mail'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'
import {
  FeaturesEditor,
  LinkEditor,
  MailEditor,
  PostsEditor,
  ProjectsEditor,
  SiteEditor,
  SkillGroupsEditor,
  ToolchainEditor,
} from './sections'

type Status = 'loading' | 'guest' | 'ready'

/** 后台面板：内容分区 + 单独的系统设置项。 */
type Panel = ContentSection | 'mail'

const panelLabels: Record<Panel, string> = { ...sectionLabels, mail: '邮件设置' }

interface ApiResult {
  ok: boolean
  error?: string
  content?: SiteContent
  mail?: MailSettingsView
  authenticated?: boolean
}

interface SaveState {
  state: 'idle' | 'saving' | 'ok' | 'error'
  message?: string
}

async function callApi(url: string, init?: RequestInit): Promise<ApiResult> {
  try {
    const response = await fetch(url, init)
    return (await response.json()) as ApiResult
  } catch {
    return { ok: false, error: '网络请求失败，请稍后重试' }
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function Admin() {
  usePageMeta('内容管理')
  const { refresh } = useContent()

  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<SiteContent | null>(null)
  /** 最近一次载入或保存后的快照，用来判断是否有未保存改动。 */
  const [savedDraft, setSavedDraft] = useState<SiteContent | null>(null)
  const [active, setActive] = useState<Panel>('site')
  const [mail, setMail] = useState<MailSettingsView | null>(null)
  const [savedMail, setSavedMail] = useState<MailSettingsView | null>(null)
  const [mailPassword, setMailPassword] = useState('')
  const [save, setSave] = useState<SaveState>({ state: 'idle' })

  const loadDraft = useCallback(async (): Promise<boolean> => {
    const data = await callApi('/api/admin/content')
    if (!data.ok || !data.content) {
      setNotice(data.error ?? '内容加载失败')
      return false
    }
    setDraft(data.content)
    setSavedDraft(data.content)

    // 邮件设置单独一个接口：密码不下发，只回 passwordSet
    const mailData = await callApi('/api/admin/mail')
    setMail(mailData.mail ?? null)
    setSavedMail(mailData.mail ?? null)
    setMailPassword('')

    setNotice('')
    return true
  }, [])

  // 首次进入：先看会话，再决定渲染登录表单还是编辑器
  useEffect(() => {
    let cancelled = false

    void (async () => {
      const session = await callApi('/api/auth/session')
      if (cancelled) return

      if (!session.authenticated) {
        setStatus('guest')
        return
      }

      const loaded = await loadDraft()
      if (cancelled) return
      setStatus(loaded ? 'ready' : 'guest')
    })()

    return () => {
      cancelled = true
    }
  }, [loadDraft])

  function patch<K extends ContentSection>(key: K, value: SiteContent[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  /** 用服务端返回的最新内容同时刷新草稿与快照；服务端没回内容时返回 false。 */
  function applyServerContent(data: ApiResult): boolean {
    if (!data.content) return false
    setDraft(data.content)
    setSavedDraft(data.content)
    return true
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setNotice('')

    const data = await callApi('/api/auth/login', jsonInit('POST', { password }))
    if (!data.ok) {
      setNotice(data.error ?? '登录失败')
      setBusy(false)
      return
    }

    const loaded = await loadDraft()
    setPassword('')
    setStatus(loaded ? 'ready' : 'guest')
    setBusy(false)
  }

  async function handleLogout() {
    setBusy(true)
    await callApi('/api/auth/logout', { method: 'POST' })
    setDraft(null)
    setSavedDraft(null)
    setMail(null)
    setSavedMail(null)
    setStatus('guest')
    setSave({ state: 'idle' })
    setNotice('已退出登录')
    setBusy(false)
  }

  /** 统一的提交状态流转：置为保存中、发请求，成功或失败后落状态并解除 busy。 */
  async function submit(
    request: () => Promise<ApiResult>,
    okMessage: string,
    errorMessage = '保存失败',
  ): Promise<{ ok: boolean; data: ApiResult }> {
    setBusy(true)
    setSave({ state: 'saving' })

    const data = await request()
    if (!data.ok) {
      setSave({ state: 'error', message: data.error ?? errorMessage })
      setBusy(false)
      return { ok: false, data }
    }

    setSave({ state: 'ok', message: okMessage })
    setBusy(false)
    return { ok: true, data }
  }

  async function handleSave() {
    if (active === 'mail') {
      await handleSaveMail()
      return
    }
    if (!draft) return

    const payload = draft[active]
    const { ok, data } = await submit(
      () => callApi(`/api/admin/content/${active}`, jsonInit('PUT', payload)),
      `「${panelLabels[active]}」已保存`,
    )
    if (!ok) return

    if (!applyServerContent(data)) {
      setSavedDraft((prev) => (prev ? { ...prev, [active]: payload } : prev))
    }
    // 同步前台数据层，切回页面即是新内容
    void refresh()
  }

  async function handleSaveMail() {
    if (!mail) return

    // 密码留空时服务端会沿用已保存的值
    const { ok, data } = await submit(
      () => callApi('/api/admin/mail', jsonInit('PUT', { ...mail, password: mailPassword })),
      '「邮件设置」已保存',
    )
    if (!ok || !data.mail) return

    setMail(data.mail)
    setSavedMail(data.mail)
    setMailPassword('')
  }

  async function handleReset() {
    if (active === 'mail') return
    if (!window.confirm(`确定把「${panelLabels[active]}」恢复为内置默认内容吗？`)) return

    const { ok, data } = await submit(
      () => callApi(`/api/admin/content/${active}`, { method: 'DELETE' }),
      `「${panelLabels[active]}」已恢复默认`,
      '恢复失败',
    )
    if (!ok) return

    applyServerContent(data)
    void refresh()
  }

  function selectSection(section: Panel) {
    setActive(section)
    setSave({ state: 'idle' })
  }

  if (status === 'loading') {
    return (
      <div className="admin-page">
        <div className="container admin-login">
          <p className="admin-hint">正在检查登录状态…</p>
        </div>
      </div>
    )
  }

  if (status === 'guest' || !draft) {
    return (
      <div className="admin-page">
        <form className="container admin-login" onSubmit={handleLogin}>
          <h1 className="admin-login-title">内容管理</h1>
          <p className="admin-hint">输入后台密码后可编辑站点内容。</p>
          <input
            className="admin-input"
            type="password"
            value={password}
            placeholder="后台密码"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="admin-btn primary" type="submit" disabled={busy || !password}>
            {busy ? '登录中…' : '登录'}
          </button>
          {notice ? <p className="admin-status err">{notice}</p> : null}
        </form>
      </div>
    )
  }

  // 当前面板是否有未保存的改动（与最近一次载入/保存的快照比较）
  const dirty =
    active === 'mail'
      ? mail !== null && (mailPassword !== '' || JSON.stringify(mail) !== JSON.stringify(savedMail))
      : JSON.stringify(draft[active]) !== JSON.stringify(savedDraft?.[active])

  const saveText =
    save.state === 'saving'
      ? '处理中…'
      : save.state === 'idle'
        ? dirty
          ? '有未保存的改动'
          : '已是最新'
        : (save.message ?? '')

  const saveClass =
    save.state === 'error'
      ? 'admin-status err'
      : save.state === 'ok'
        ? 'admin-status ok'
        : dirty
          ? 'admin-status warn'
          : 'admin-status'

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-top">
          <div>
            <h1>内容管理</h1>
            <p className="admin-hint">修改后点击「保存」，前台刷新即可看到。</p>
          </div>
          <div className="admin-actions">
            <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
              查看站点
            </a>
            <button className="admin-btn" type="button" disabled={busy} onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </div>

        <div className="admin-body">
          <nav className="admin-nav">
            {contentSections.map((section) => (
              <button
                key={section}
                type="button"
                className={section === active ? 'active' : undefined}
                onClick={() => selectSection(section)}
              >
                {sectionLabels[section]}
              </button>
            ))}
            <button
              type="button"
              className={active === 'mail' ? 'active' : undefined}
              onClick={() => selectSection('mail')}
            >
              邮件设置
            </button>
          </nav>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>{panelLabels[active]}</h2>
            </div>

            {active === 'mail' ? (
              mail ? (
                <MailEditor
                  value={mail}
                  password={mailPassword}
                  onChange={setMail}
                  onPasswordChange={setMailPassword}
                />
              ) : (
                <p className="admin-hint">邮件设置加载失败，请刷新页面重试。</p>
              )
            ) : null}
            {active === 'site' ? (
              <SiteEditor value={draft.site} onChange={(site) => patch('site', site)} />
            ) : null}
            {active === 'links' ? (
              <LinkEditor value={draft.links} onChange={(links) => patch('links', links)} />
            ) : null}
            {active === 'features' ? (
              <FeaturesEditor value={draft.features} onChange={(features) => patch('features', features)} />
            ) : null}
            {active === 'projects' ? (
              <ProjectsEditor value={draft.projects} onChange={(projects) => patch('projects', projects)} />
            ) : null}
            {active === 'skillGroups' ? (
              <SkillGroupsEditor
                value={draft.skillGroups}
                onChange={(skillGroups) => patch('skillGroups', skillGroups)}
              />
            ) : null}
            {active === 'toolchain' ? (
              <ToolchainEditor value={draft.toolchain} onChange={(toolchain) => patch('toolchain', toolchain)} />
            ) : null}
            {active === 'posts' ? (
              <PostsEditor value={draft.posts} onChange={(posts) => patch('posts', posts)} />
            ) : null}

            {notice ? <p className="admin-status err">{notice}</p> : null}

            <div className="admin-savebar">
              <span className={saveClass}>{saveText}</span>
              <div className="admin-panel-actions">
                {active === 'mail' ? null : (
                  <button className="admin-btn" type="button" disabled={busy} onClick={handleReset}>
                    恢复默认
                  </button>
                )}
                <button
                  className="admin-btn primary"
                  type="button"
                  disabled={busy || !dirty}
                  onClick={handleSave}
                >
                  保存
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

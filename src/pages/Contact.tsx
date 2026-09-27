import { useState } from 'react'
import type { FormEvent } from 'react'
import { PageSection } from '../components/PageSection'
import { usePageMeta } from '../hooks/usePageMeta'
import { useLinks, useSite } from '../hooks/useContent'

type SubmitState = 'idle' | 'sending' | 'ok' | 'error'

const EMPTY_FORM = { name: '', email: '', message: '' }

export function Contact() {
  const site = useSite()
  const links = useLinks()
  usePageMeta('联系方式', `通过邮件或留言联系 ${site.name}。`)

  const [form, setForm] = useState(EMPTY_FORM)
  const [state, setState] = useState<SubmitState>('idle')
  const [note, setNote] = useState('')

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setNote('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !data.ok) {
        setState('error')
        setNote(data.error ?? '提交失败，请稍后重试。')
        return
      }

      setState('ok')
      setNote('留言已提交，我会尽快回复你。')
      setForm(EMPTY_FORM)
    } catch {
      setState('error')
      setNote('网络异常，请稍后重试，或直接发邮件给我。')
    }
  }

  return (
    <PageSection desc="Contact" title="联系方式">
      <div className="contact-grid">
        <div className="info-list">
          <div className="info-item">
            <div className="lab">邮箱</div>
            <div className="val">
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>
          <div className="info-item">
            <div className="lab">所在地</div>
            <div className="val">{site.location}</div>
          </div>
          <div className="info-item">
            <div className="lab">当前状态</div>
            <div className="val">{site.status}</div>
          </div>
          <div className="info-item">
            <div className="lab">社交主页</div>
            <div className="val">
              {links.socials.map((item, index) => (
                <span key={item.href}>
                  {index > 0 ? ' · ' : ''}
                  <a href={item.href} target="_blank" rel="noreferrer noopener">
                    {item.label}
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>

        <form className="forms" onSubmit={handleSubmit} noValidate>
          <div className="item">
            <label className="lab" htmlFor="contact-name">
              你的称呼
            </label>
            <input
              id="contact-name"
              className="entry-sty"
              type="text"
              value={form.name}
              maxLength={50}
              placeholder="怎么称呼你？"
              onChange={(event) => update('name', event.target.value)}
            />
          </div>

          <div className="item">
            <label className="lab" htmlFor="contact-email">
              邮箱
            </label>
            <input
              id="contact-email"
              className="entry-sty"
              type="email"
              value={form.email}
              maxLength={100}
              placeholder="方便我回复你"
              onChange={(event) => update('email', event.target.value)}
            />
          </div>

          <div className="item">
            <label className="lab" htmlFor="contact-message">
              留言内容
            </label>
            <textarea
              id="contact-message"
              className="entry-sty"
              value={form.message}
              maxLength={2000}
              placeholder="想聊点什么？项目、合作，或者只是打个招呼。"
              onChange={(event) => update('message', event.target.value)}
            />
          </div>

          <div className="item">
            <button className="submit-button" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? '提交中…' : '提交留言'}
            </button>
          </div>

          {note ? (
            <p className={state === 'ok' ? 'form-note ok' : 'form-note err'} role="status">
              {note}
            </p>
          ) : null}
        </form>
      </div>
    </PageSection>
  )
}

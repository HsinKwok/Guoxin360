/** 各内容分区的编辑器：每个分区一个组件，由 Admin 按当前选中的分区渲染。 */

import { useState } from 'react'
import type { Feature, Post, Project, SkillGroup } from '../data/content'
import type { ActionLink, NavItem, SiteLinks, SocialLink } from '../data/links'
import type { MailSettingsView } from '../data/mail'
import type { SiteConfig } from '../data/site'
import { Markdown } from '../components/Markdown'
import { moveItem, NumberField, ObjectList, removeAt, SelectField, StringList, TextField } from './fields'

interface EditorProps<T> {
  value: T
  onChange: (value: T) => void
}

type Principle = { title: string; desc: string }

/** 本地时区的今天（YYYY-MM-DD）；toISOString 走 UTC，东八区凌晨会差一天 */
function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function SiteEditor({ value, onChange }: EditorProps<SiteConfig>) {
  const patch = (part: Partial<SiteConfig>) => onChange({ ...value, ...part })

  return (
    <div className="admin-stack">
      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">基本信息</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-fields">
            <TextField label="站点标识" value={value.brand} onChange={(brand) => patch({ brand })} />
            <TextField label="姓名" value={value.name} onChange={(name) => patch({ name })} />
            <TextField label="英文名" value={value.nameEn} onChange={(nameEn) => patch({ nameEn })} />
            <TextField label="身份" value={value.role} onChange={(role) => patch({ role })} />
            <TextField label="一句话标签" value={value.tagline} onChange={(tagline) => patch({ tagline })} />
            <TextField label="当前状态" value={value.status} onChange={(status) => patch({ status })} />
            <TextField label="域名" value={value.domain} onChange={(domain) => patch({ domain })} />
            <TextField label="邮箱" value={value.email} onChange={(email) => patch({ email })} />
            <TextField label="所在地" value={value.location} onChange={(location) => patch({ location })} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">简介文案</span>
        </div>
        <div className="admin-card-body">
          <TextField
            label="首页简介"
            markdown
            rows={3}
            value={value.intro}
            onChange={(intro) => patch({ intro })}
          />
          <TextField
            label="页脚简介"
            markdown
            rows={3}
            value={value.footerAbout}
            onChange={(footerAbout) => patch({ footerAbout })}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">SEO 默认值</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-fields">
            <TextField
              label="默认标题"
              value={value.defaultTitle}
              onChange={(defaultTitle) => patch({ defaultTitle })}
            />
            <TextField label="关键词" value={value.keywords} onChange={(keywords) => patch({ keywords })} />
          </div>
          <TextField
            label="默认描述"
            textarea
            rows={2}
            value={value.defaultDescription}
            onChange={(defaultDescription) => patch({ defaultDescription })}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">图片地址</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-fields">
            <TextField label="头像地址" value={value.avatar} onChange={(avatar) => patch({ avatar })} />
            <TextField label="封面地址" value={value.cover} onChange={(cover) => patch({ cover })} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">关于我</span>
        </div>
        <div className="admin-card-body">
          <TextField
            label="正文"
            markdown
            rows={8}
            placeholder="用 Markdown 书写，段落之间空一行。"
            value={value.about}
            onChange={(about) => patch({ about })}
          />
        </div>
      </div>

      <ObjectList<Principle>
        label="原则卡片"
        value={value.principles}
        onChange={(principles) => patch({ principles })}
        createItem={() => ({ title: '新标题', desc: '' })}
        title={(item) => item.title || '未命名'}
        renderItem={(item, set) => (
          <div className="admin-fields">
            <TextField label="标题" value={item.title} onChange={(title) => set({ title })} />
            <TextField label="描述" value={item.desc} onChange={(desc) => set({ desc })} />
          </div>
        )}
        addLabel="添加卡片"
      />
    </div>
  )
}

/** 顶部导航与快捷入口都是「名称 + 站内路径」，抽出来共用。 */
function linkFields(
  item: { label: string; to: string },
  set: (part: { label?: string; to?: string }) => void,
  pathPlaceholder: string,
) {
  return (
    <div className="admin-fields">
      <TextField label="名称" value={item.label} onChange={(label) => set({ label })} />
      <TextField label="路径" placeholder={pathPlaceholder} value={item.to} onChange={(to) => set({ to })} />
    </div>
  )
}

export function LinkEditor({ value, onChange }: EditorProps<SiteLinks>) {
  const patch = (part: Partial<SiteLinks>) => onChange({ ...value, ...part })

  return (
    <div className="admin-stack">
      <ObjectList<NavItem>
        label="顶部导航"
        hint="显示在：页头主导航 · 页脚「站点导航」"
        value={value.nav}
        onChange={(nav) => patch({ nav })}
        createItem={() => ({ label: '新菜单', to: '/' })}
        title={(item) => item.label || '未命名菜单'}
        renderItem={(item, set) => linkFields(item, set, '/about')}
        addLabel="添加菜单"
      />

      <ObjectList<ActionLink>
        label="快捷入口"
        hint="显示在：页头右上角"
        value={value.actions}
        onChange={(actions) => patch({ actions })}
        createItem={() => ({ label: '新按钮', to: '/' })}
        title={(item) => item.label || '未命名按钮'}
        renderItem={(item, set) => linkFields(item, set, '/contact')}
        addLabel="添加按钮"
      />

      <ObjectList<SocialLink>
        label="社交链接"
        hint="显示在：页脚「站点导航」· 联系方式页"
        value={value.socials}
        onChange={(socials) => patch({ socials })}
        createItem={() => ({ label: '新平台', href: '' })}
        title={(item) => item.label || '未命名平台'}
        renderItem={(item, set) => (
          <div className="admin-fields">
            <TextField label="平台" value={item.label} onChange={(label) => set({ label })} />
            <TextField label="链接" value={item.href} onChange={(href) => set({ href })} />
          </div>
        )}
        addLabel="添加平台"
      />
    </div>
  )
}

export function FeaturesEditor({ value, onChange }: EditorProps<Feature[]>) {
  return (
    <ObjectList<Feature>
      label="核心方向"
      value={value}
      onChange={onChange}
      createItem={() => ({ title: '新方向', desc: '' })}
      title={(item) => item.title || '未命名方向'}
      renderItem={(item, set) => (
        <>
          <TextField label="标题" value={item.title} onChange={(title) => set({ title })} />
          <TextField label="描述" textarea rows={3} value={item.desc} onChange={(desc) => set({ desc })} />
        </>
      )}
      addLabel="添加方向"
    />
  )
}

export function ProjectsEditor({ value, onChange }: EditorProps<Project[]>) {
  return (
    <ObjectList<Project>
      label="项目作品"
      value={value}
      onChange={onChange}
      createItem={() => ({
        slug: '',
        name: '',
        summary: '',
        year: String(new Date().getFullYear()),
        tags: [],
      })}
      title={(item) => item.name || '未命名项目'}
      renderItem={(item, set) => (
        <>
          <span className="admin-group-title">基本信息</span>
          <div className="admin-fields">
            <TextField label="项目名" value={item.name} onChange={(name) => set({ name })} />
            <TextField
              label="标识（slug）"
              placeholder="edge-notes"
              value={item.slug}
              onChange={(slug) => set({ slug })}
            />
            <TextField label="年份" value={item.year} onChange={(year) => set({ year })} />
            <TextField
              label="链接"
              placeholder="留空则不显示跳转"
              value={item.href ?? ''}
              onChange={(href) => set({ href })}
            />
          </div>
          <span className="admin-group-title">简介与标签</span>
          <TextField
            label="简介"
            textarea
            rows={3}
            value={item.summary}
            onChange={(summary) => set({ summary })}
          />
          <StringList
            label="技术标签"
            addLabel="添加标签"
            value={item.tags}
            onChange={(tags) => set({ tags })}
          />
        </>
      )}
      addLabel="添加项目"
    />
  )
}

export function SkillGroupsEditor({ value, onChange }: EditorProps<SkillGroup[]>) {
  return (
    <ObjectList<SkillGroup>
      label="技能分组"
      value={value}
      onChange={onChange}
      createItem={() => ({ title: '新分组', items: [] })}
      title={(item) => item.title || '未命名分组'}
      renderItem={(item, set) => (
        <>
          <TextField label="分组名" value={item.title} onChange={(title) => set({ title })} />
          <ObjectList<SkillGroup['items'][number]>
            label="技能项"
            value={item.items}
            onChange={(items) => set({ items })}
            createItem={() => ({ name: '新技能', level: 60 })}
            title={(skill) => skill.name || '未命名技能'}
            renderItem={(skill, setSkill) => (
              <div className="admin-fields">
                <TextField label="名称" value={skill.name} onChange={(name) => setSkill({ name })} />
                <NumberField label="掌握度" value={skill.level} onChange={(level) => setSkill({ level })} />
              </div>
            )}
            addLabel="添加技能"
          />
        </>
      )}
      addLabel="添加分组"
    />
  )
}

export function ToolchainEditor({ value, onChange }: EditorProps<string[]>) {
  return <StringList label="工具链" addLabel="添加工具" value={value} onChange={onChange} />
}

interface MailEditorProps {
  value: MailSettingsView
  /** 新密码只在本次编辑里保存；留空表示沿用服务端已存的密码。 */
  password: string
  onChange: (value: MailSettingsView) => void
  onPasswordChange: (value: string) => void
}

export function MailEditor({ value, password, onChange, onPasswordChange }: MailEditorProps) {
  const patch = (part: Partial<MailSettingsView>) => onChange({ ...value, ...part })

  return (
    <div className="admin-stack">
      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">SMTP 服务器</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-fields">
            <TextField
              label="服务器地址"
              placeholder="smtp.example.com"
              value={value.host}
              onChange={(host) => patch({ host })}
            />
            <TextField
              label="端口"
              placeholder="465"
              value={value.port}
              onChange={(port) => patch({ port })}
            />
            <SelectField
              label="加密方式"
              value={value.secure ? 'ssl' : 'starttls'}
              options={[
                { value: 'ssl', label: 'SSL/TLS（一般配 465 端口）' },
                { value: 'starttls', label: 'STARTTLS（一般配 587 端口）' },
              ]}
              onChange={(mode) => patch({ secure: mode === 'ssl' })}
            />
            <TextField
              label="用户名"
              value={value.username}
              onChange={(username) => patch({ username })}
            />
            <TextField
              label="密码 / 授权码"
              type="password"
              placeholder={value.passwordSet ? '已保存，留空则不修改' : '尚未设置'}
              value={password}
              onChange={onPasswordChange}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">发件人</span>
        </div>
        <div className="admin-card-body">
          <p className="admin-hint">
            发件邮箱一般要和 SMTP 服务商验证过的域名一致，否则容易被判为垃圾邮件；
            留言的收件邮箱在 Worker 的 CONTACT_TO 环境变量里配置。
          </p>
          <div className="admin-fields">
            <TextField
              label="显示名"
              placeholder="站点留言"
              value={value.fromName}
              onChange={(fromName) => patch({ fromName })}
            />
            <TextField
              label="发件邮箱"
              placeholder="noreply@example.com"
              value={value.fromEmail}
              onChange={(fromEmail) => patch({ fromEmail })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PostsEditor({ value, onChange }: EditorProps<Post[]>) {
  /** 当前正在编辑的文章下标；为 null 时显示文章列表。纯 UI 状态，不进表单数据。 */
  const [editing, setEditing] = useState<number | null>(null)

  const editingPost = editing === null ? undefined : value[editing]

  if (editingPost) {
    const set = (part: Partial<Post>) =>
      onChange(value.map((item, index) => (index === editing ? { ...item, ...part } : item)))

    return (
      <div className="admin-stack">
        <div className="admin-card">
          <div className="admin-card-head">
            <span className="admin-card-title">{editingPost.title || '未命名文章'}</span>
            <button type="button" className="admin-btn" onClick={() => setEditing(null)}>
              ← 返回列表
            </button>
          </div>
          <div className="admin-card-body">
            <span className="admin-group-title">基本信息</span>
            <div className="admin-fields">
              <TextField label="标题" value={editingPost.title} onChange={(title) => set({ title })} />
              <TextField
                label="标识（slug）"
                placeholder="why-workers"
                value={editingPost.slug}
                onChange={(slug) => set({ slug })}
              />
              <TextField
                label="日期"
                placeholder="2026-08-12"
                value={editingPost.date}
                onChange={(date) => set({ date })}
              />
            </div>
            <span className="admin-group-title">摘要与标签</span>
            <TextField
              label="摘要"
              textarea
              rows={2}
              value={editingPost.summary}
              onChange={(summary) => set({ summary })}
            />
            <StringList
              label="标签"
              addLabel="添加标签"
              value={editingPost.tags}
              onChange={(tags) => set({ tags })}
            />
            <span className="admin-group-title">正文</span>
            <TextField
              label="正文"
              markdown
              rows={16}
              placeholder="用 Markdown 书写，段落之间空一行。"
              value={editingPost.content}
              onChange={(content) => set({ content })}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-list">
      <div className="admin-list-head">
        <span className="admin-label">博客文章</span>
        <button
          type="button"
          className="admin-add"
          onClick={() => {
            onChange([
              ...value,
              { slug: '', title: '', date: todayLocal(), summary: '', tags: [], content: '' },
            ])
            setEditing(value.length)
          }}
        >
          + 添加文章
        </button>
      </div>

      <p className="admin-hint">点击文章进入编辑，悬停可预览正文。</p>

      {value.map((item, index) => (
        <div className="admin-post" key={index}>
          <button type="button" className="admin-post-main" onClick={() => setEditing(index)}>
            <span className="admin-post-title">{item.title || '未命名文章'}</span>
            <span className="admin-post-meta">
              {[item.date, item.tags.join(' / ')].filter(Boolean).join(' · ') || '未设置日期'}
            </span>
            {item.summary ? <span className="admin-post-summary">{item.summary}</span> : null}
          </button>

          <div className="admin-post-actions">
            <button type="button" className="edit" onClick={() => setEditing(index)}>
              编辑
            </button>
            <button
              type="button"
              title="上移"
              disabled={index === 0}
              onClick={() => onChange(moveItem(value, index, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              title="下移"
              disabled={index === value.length - 1}
              onClick={() => onChange(moveItem(value, index, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onChange(removeAt(value, index))}
            >
              删除
            </button>
          </div>

          <div className="admin-post-preview">
            {item.summary ? <p className="admin-post-preview-summary">{item.summary}</p> : null}
            {item.content.trim() ? (
              <Markdown className="admin-post-preview-md" source={item.content} />
            ) : (
              <p className="admin-hint">暂无正文</p>
            )}
          </div>
        </div>
      ))}

      {value.length === 0 ? <p className="admin-empty">暂无内容</p> : null}
    </div>
  )
}

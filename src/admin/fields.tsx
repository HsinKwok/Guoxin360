/** 后台表单基础组件：单字段输入、Markdown 编辑、字符串列表、对象列表（增删/排序）。 */

import { useEffect, useRef, type ReactNode } from 'react'

/** HTML 转义表：高亮层会遇到且必须转义的只有这三种字符。 */
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }

function escapeHtml(text: string) {
  return text.replace(/[&<>]/g, (char) => HTML_ESCAPES[char])
}

/**
 * 行内高亮：代码、加粗、斜体、链接。
 * 必须用一次 replace 加交替分支完成——串联多次 replace 时，斜体规则会咬进已生成的加粗标签里。
 * 传入的文本已经转义过，回调里不再二次转义。
 */
function highlightInline(text: string) {
  return text.replace(
    /(`+)([^`]+)\1|(\*\*)([^*]+)\3|(\*)([^*]+)\5|\[([^\]]*)\]\(([^)]*)\)/g,
    (
      _match,
      tick: string | undefined,
      code: string | undefined,
      boldMark: string | undefined,
      bold: string | undefined,
      emMark: string | undefined,
      em: string | undefined,
      linkText: string | undefined,
      linkUrl: string | undefined,
    ) => {
      if (code !== undefined) {
        return `<span class="md-hl-mark">${tick}</span><span class="md-hl-code">${code}</span><span class="md-hl-mark">${tick}</span>`
      }
      if (bold !== undefined) {
        return `<span class="md-hl-mark">${boldMark}</span><span class="md-hl-strong">${bold}</span><span class="md-hl-mark">${boldMark}</span>`
      }
      if (em !== undefined) {
        return `<span class="md-hl-mark">${emMark}</span><span class="md-hl-em">${em}</span><span class="md-hl-mark">${emMark}</span>`
      }
      return `<span class="md-hl-mark">[</span><span class="md-hl-link">${linkText}</span><span class="md-hl-mark">](</span><span class="md-hl-url">${linkUrl}</span><span class="md-hl-mark">)</span>`
    },
  )
}

/** 每行包一个 <div>，这样高亮层的行数与输入框的视觉行数严格一致。 */
function asLine(html: string, extra?: string) {
  return `<div class="md-live-line${extra ? ` ${extra}` : ''}">${html}</div>`
}

/** 逐行高亮：标题、引用、列表标记单独着色，其余走行内规则。 */
function highlightLine(line: string) {
  const escaped = escapeHtml(line)

  const heading = /^(#{1,6}\s+)([\s\S]*)$/.exec(escaped)
  if (heading) {
    return asLine(
      `<span class="md-hl-mark">${heading[1]}</span><span class="md-hl-heading">${highlightInline(heading[2])}</span>`,
    )
  }

  const quote = /^(&gt;\s?)([\s\S]*)$/.exec(escaped)
  if (quote) {
    return asLine(
      `<span class="md-hl-mark">${quote[1]}</span>${highlightInline(quote[2])}`,
      'md-live-quote',
    )
  }

  const list = /^(\s*)([-*+]|\d+\.)(\s+)([\s\S]*)$/.exec(escaped)
  if (list) {
    return asLine(
      `${list[1]}<span class="md-hl-mark">${list[2]}${list[3]}</span>${highlightInline(list[4])}`,
    )
  }

  return asLine(highlightInline(escaped))
}

/** 源码 → 高亮 HTML。空行靠 CSS 的 min-height 撑出一行，避免末尾换行被 pre-wrap 吃掉。 */
function highlightSource(source: string) {
  return source.split('\n').map(highlightLine).join('')
}

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

function MarkdownInput({ value, onChange, rows = 6, placeholder }: MarkdownInputProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  /** 高亮层要跟着输入框一起滚，否则文字会跑偏。 */
  function syncScroll() {
    const area = areaRef.current
    const layer = layerRef.current
    if (!area || !layer) return
    layer.scrollTop = area.scrollTop
    layer.scrollLeft = area.scrollLeft
  }

  // 每次渲染后再对齐一次，覆盖输入、自动滚动、面板切换等情况
  useEffect(syncScroll)

  /** 改完内容后把光标放回原处：React 重渲染会重置 textarea 的选区。 */
  function apply(next: string, start: number, end: number) {
    onChange(next)
    requestAnimationFrame(() => {
      areaRef.current?.focus()
      areaRef.current?.setSelectionRange(start, end)
      syncScroll()
    })
  }

  /** 用 before / after 包住选区，如 **加粗**、[文字](链接)。 */
  function wrap(before: string, after: string, fallback: string) {
    const area = areaRef.current
    if (!area) return
    const { selectionStart: start, selectionEnd: end } = area
    const picked = value.slice(start, end) || fallback
    apply(
      `${value.slice(0, start)}${before}${picked}${after}${value.slice(end)}`,
      start + before.length,
      start + before.length + picked.length,
    )
  }

  /** 给选区覆盖到的每一行加前缀，如 ## 标题、- 列表、> 引用。 */
  function prefix(mark: string) {
    const area = areaRef.current
    if (!area) return
    const start = value.lastIndexOf('\n', area.selectionStart - 1) + 1
    const lineBreak = value.indexOf('\n', area.selectionEnd)
    const stop = lineBreak === -1 ? value.length : lineBreak
    const merged = value
      .slice(start, stop)
      .split('\n')
      .map((line) => `${mark}${line}`)
      .join('\n')
    apply(`${value.slice(0, start)}${merged}${value.slice(stop)}`, start, start + merged.length)
  }

  const tools: { label: string; run: () => void }[] = [
    { label: '加粗', run: () => wrap('**', '**', '粗体') },
    { label: '斜体', run: () => wrap('*', '*', '斜体') },
    { label: '链接', run: () => wrap('[', '](https://)', '链接文字') },
    { label: '代码', run: () => wrap('`', '`', 'code') },
    { label: '标题', run: () => prefix('## ') },
    { label: '列表', run: () => prefix('- ') },
    { label: '引用', run: () => prefix('> ') },
  ]

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        {tools.map((tool) => (
          <button key={tool.label} type="button" onClick={tool.run}>
            {tool.label}
          </button>
        ))}
      </div>

      <div className="md-live">
        <div
          className="md-live-layer"
          ref={layerRef}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightSource(value) }}
        />
        <textarea
          className="md-live-input"
          ref={areaRef}
          rows={rows}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
        />
      </div>
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  textarea?: boolean
  /** 用 Markdown 编辑器替换纯文本输入，内容按 Markdown 渲染。 */
  markdown?: boolean
  /** 输入框类型；密码类字段用 password，配合 placeholder 说明「留空则不修改」。 */
  type?: 'text' | 'password'
  rows?: number
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
  markdown = false,
  type = 'text',
  rows = 4,
}: TextFieldProps) {
  // Markdown 编辑区里有按钮，不能用 <label> 包裹，否则点标签会误触第一个按钮
  if (markdown) {
    return (
      <div className="admin-field">
        <span className="admin-label">{label}</span>
        <MarkdownInput value={value} onChange={onChange} rows={rows} placeholder={placeholder} />
      </div>
    )
  }

  return (
    <label className="admin-field">
      <span className="admin-label">{label}</span>
      {textarea ? (
        <textarea
          className="admin-input"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="admin-field">
      <span className="admin-label">{label}</span>
      <select
        className="admin-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function NumberField({ label, value, onChange, min = 0, max = 100 }: NumberFieldProps) {
  return (
    <label className="admin-field">
      <span className="admin-label">
        {label}
        <span className="admin-suffix">%</span>
      </span>
      <input
        className="admin-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          onChange(Math.min(max, Math.max(min, Number.isFinite(next) ? next : min)))
        }}
      />
    </label>
  )
}

interface RowActionsProps {
  index: number
  total: number
  onMove: (index: number, offset: number) => void
  onRemove: (index: number) => void
}

function RowActions({ index, total, onMove, onRemove }: RowActionsProps) {
  return (
    <div className="admin-row-actions">
      <button
        type="button"
        title="上移"
        aria-label="上移"
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
      >
        ↑
      </button>
      <button
        type="button"
        title="下移"
        aria-label="下移"
        disabled={index === total - 1}
        onClick={() => onMove(index, 1)}
      >
        ↓
      </button>
      <button
        type="button"
        className="danger"
        title="删除"
        aria-label="删除"
        onClick={() => onRemove(index)}
      >
        ✕
      </button>
    </div>
  )
}

export function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const target = index + offset
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

/** 用新值替换第 index 项，返回新数组（不改动原数组）。 */
export function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, i) => (i === index ? value : item))
}

/** 删除第 index 项，返回新数组（不改动原数组）。 */
export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index)
}

/** 估算文本占宽（CJK 按 2 个字符算）。仅作为旧内核不支持 field-sizing 时的降级宽度，
 *  支持的浏览器由 CSS 的 field-sizing: content 覆盖。 */
function chipSize(text: string): number {
  let width = 0
  for (const char of text) width += /[\u2e80-\u9fff\uff00-\uffef]/.test(char) ? 2 : 1
  return Math.min(Math.max(width + 1, 6), 40)
}

interface StringListProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  /** 列表标题下的说明，一般用来标注这组内容的展示位置。 */
  hint?: string
  textarea?: boolean
  /** 每一项都用 Markdown 编辑器编辑，内容按 Markdown 渲染。 */
  markdown?: boolean
  addLabel?: string
  placeholder?: string
}

export function StringList({
  label,
  value,
  onChange,
  hint,
  textarea = false,
  markdown = false,
  addLabel = '添加',
  placeholder,
}: StringListProps) {
  return (
    <div className="admin-list">
      <div className="admin-list-head">
        <span className="admin-label">{label}</span>
        <button type="button" className="admin-add" onClick={() => onChange([...value, ''])}>
          + {addLabel}
        </button>
      </div>

      {hint ? <p className="admin-hint">{hint}</p> : null}

      {markdown || textarea
        ? value.map((item, index) => (
            <div className="admin-row" key={index}>
              {markdown ? (
                <MarkdownInput
                  value={item}
                  rows={5}
                  placeholder={placeholder}
                  onChange={(next) => onChange(replaceAt(value, index, next))}
                />
              ) : (
                <textarea
                  className="admin-input"
                  rows={3}
                  value={item}
                  placeholder={placeholder}
                  onChange={(event) => onChange(replaceAt(value, index, event.target.value))}
                />
              )}
              <RowActions
                index={index}
                total={value.length}
                onMove={(i, offset) => onChange(moveItem(value, i, offset))}
                onRemove={(i) => onChange(removeAt(value, i))}
              />
            </div>
          ))
        : value.length > 0 && (
            <div className="admin-chips">
              {value.map((item, index) => (
                <div className="admin-chip" key={index}>
                  <input
                    className="admin-input"
                    type="text"
                    size={chipSize(item)}
                    value={item}
                    placeholder={placeholder}
                    onChange={(event) => onChange(replaceAt(value, index, event.target.value))}
                  />
                  <span className="admin-chip-tools">
                    <button
                      type="button"
                      title="删除"
                      onClick={() => onChange(removeAt(value, index))}
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

      {value.length === 0 ? <p className="admin-empty">暂无内容</p> : null}
    </div>
  )
}

interface ObjectListProps<T> {
  label: string
  value: T[]
  onChange: (value: T[]) => void
  createItem: () => T
  title: (item: T, index: number) => string
  renderItem: (item: T, patch: (part: Partial<T>) => void) => ReactNode
  /** 列表标题下的说明，一般用来标注这组内容的展示位置。 */
  hint?: string
  addLabel?: string
}

export function ObjectList<T>({
  label,
  value,
  onChange,
  createItem,
  title,
  renderItem,
  hint,
  addLabel = '添加一项',
}: ObjectListProps<T>) {
  return (
    <div className="admin-list">
      <div className="admin-list-head">
        <span className="admin-label">{label}</span>
        <button type="button" className="admin-add" onClick={() => onChange([...value, createItem()])}>
          + {addLabel}
        </button>
      </div>

      {hint ? <p className="admin-hint">{hint}</p> : null}

      {value.map((item, index) => (
        <div className="admin-card" key={index}>
          <div className="admin-card-head">
            <span className="admin-card-title">{title(item, index)}</span>
            <RowActions
              index={index}
              total={value.length}
              onMove={(i, offset) => onChange(moveItem(value, i, offset))}
              onRemove={(i) => onChange(removeAt(value, i))}
            />
          </div>
          <div className="admin-card-body">
            {renderItem(item, (part) => onChange(replaceAt(value, index, { ...item, ...part })))}
          </div>
        </div>
      ))}

      {value.length === 0 ? <p className="admin-empty">暂无内容</p> : null}
    </div>
  )
}

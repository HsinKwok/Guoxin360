/**
 * 把 Markdown 文本渲染成 HTML，前台展示与后台预览共用同一个渲染结果。
 *
 * 内容虽然只有后台管理员能写，渲染前仍过一遍 DOMPurify 白名单：
 * 一旦口令泄露被写入脚本，也不会形成存储型 XSS。
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'

// breaks: 单个换行即换行，贴近在 textarea 里写作的直觉
const markedOptions = { async: false, gfm: true, breaks: true } as const

const allowedTags = [
  'p',
  'br',
  'hr',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const allowedAttrs = ['href', 'src', 'alt', 'title', 'class', 'id']

interface MarkdownProps {
  source: string
  className?: string
}

export function Markdown({ source, className }: MarkdownProps) {
  const html = useMemo(
    () =>
      DOMPurify.sanitize(marked.parse(source, markedOptions), {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttrs,
      }),
    [source],
  )

  return (
    <div
      className={className ? `md ${className}` : 'md'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

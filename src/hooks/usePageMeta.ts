import { useEffect } from 'react'
import { useContent } from './useContent'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** 按路由更新标题、描述与分享卡片信息（单页应用的 SEO 兜底） */
export function usePageMeta(title: string, description?: string) {
  const { content, ready } = useContent()
  const site = content.site

  useEffect(() => {
    // 站点信息加载完成前不写入，保留 index.html 的静态占位标题，避免跳变
    if (!ready) return

    const fullTitle = title ? `${title} · ${site.brand}` : site.defaultTitle
    const desc = description ?? site.defaultDescription

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'keywords', site.keywords)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:site_name', site.brand)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', `https://${site.domain}${window.location.pathname}`)
  }, [ready, title, description, site])
}

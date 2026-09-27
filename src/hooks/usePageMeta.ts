import { useEffect } from 'react'
import { useSite } from './useContent'

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
export function usePageMeta(title: string, description?: string, keywords?: string) {
  const site = useSite()

  useEffect(() => {
    const fullTitle = title ? `${title} · ${site.brand}` : site.defaultTitle
    const desc = description ?? site.defaultDescription
    const words = keywords ?? site.keywords

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'keywords', words)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', `https://${site.domain}${window.location.pathname}`)
  }, [title, description, keywords, site])
}

/**
 * 站点内容数据层。
 *
 * 首屏站点信息渲染为空占位，挂载后请求 /api/content 覆盖；
 * 接口成功时用真实数据替换，接口不可用时保持空占位，不回退默认值。
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultContent, type SiteContent } from '../data/defaults'
import { blankSite } from '../data/site'

/** 首屏占位：站点信息留空，其余分区沿用内置默认 */
const placeholderContent: SiteContent = { ...defaultContent, site: blankSite }

interface ContentState {
  content: SiteContent
  /** 内容是否已成功加载；加载失败时保持 false，站点信息保持空占位 */
  ready: boolean
  /** 重新拉取内容；后台保存成功后调用它同步前台 */
  refresh: () => Promise<void>
}

const ContentContext = createContext<ContentState>({
  content: placeholderContent,
  ready: false,
  refresh: async () => {},
})

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(placeholderContent)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/content')
      const data = (await response.json()) as { ok: boolean; content?: SiteContent }
      if (response.ok && data.ok && data.content) {
        setContent(data.content)
        setReady(true)
      }
      // 接口返回异常时保持当前空占位，不回退默认内容
    } catch {
      // 接口异常时保持空占位，不回退默认内容
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ content, ready, refresh }), [content, ready, refresh])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

/** 需要多个分区时用它 */
export function useContent(): ContentState {
  return useContext(ContentContext)
}

/** 只需要站点信息时用它 */
export function useSite() {
  return useContext(ContentContext).content.site
}

/** 只需要链接配置（导航 / 快捷入口 / 社交）时用它 */
export function useLinks() {
  return useContext(ContentContext).content.links
}

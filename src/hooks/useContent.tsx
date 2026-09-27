/**
 * 站点内容数据层。
 *
 * 首屏直接用内置默认内容渲染，挂载后再请求 /api/content 覆盖；
 * 接口不可用时保留默认内容，站点照常可访问。
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultContent, type SiteContent } from '../data/defaults'

interface ContentState {
  content: SiteContent
  /** 重新拉取内容；后台保存成功后调用它同步前台 */
  refresh: () => Promise<void>
}

const ContentContext = createContext<ContentState>({
  content: defaultContent,
  refresh: async () => {},
})

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/content')
      const data = (await response.json()) as { ok: boolean; content?: SiteContent }
      if (response.ok && data.ok && data.content) setContent(data.content)
    } catch {
      // 接口异常时保持当前内容，不做额外提示
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ content, refresh }), [content, refresh])

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

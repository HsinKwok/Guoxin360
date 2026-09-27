import type { ReactNode } from 'react'

interface PageSectionProps {
  /** 区块英文小标题，对应模板中标题块的英文行 */
  desc: string
  /** 区块中文标题 */
  title: string
  children: ReactNode
}

/**
 * 内容卡片：橙色标题块 + 正文区域。
 * 对应 bbguo.com 模板里的 .content-container / .section-title 结构。
 */
export function PageSection({ desc, title, children }: PageSectionProps) {
  return (
    <div className="container content-container">
      <div className="section-title">
        <div className="title-desc">{desc}</div>
        <div className="title-main">{title}</div>
      </div>
      <div className="page-body">{children}</div>
    </div>
  )
}

/** 列表型区块为空时的占位提示。 */
export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="empty-hint">{children}</p>
}

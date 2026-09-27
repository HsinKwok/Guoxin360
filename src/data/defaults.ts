/**
 * 内容分区与内置默认值。
 *
 * 前端与 Worker 共用这一份：Worker 用它拼出「D1 覆盖 + 内置默认」的完整内容，
 * 前端用它做首屏渲染和接口失败时的兜底。
 */

import { site, type SiteConfig } from './site'
import { links, type SiteLinks } from './links'
import {
  features,
  projects,
  skillGroups,
  toolchain,
  posts,
  type Feature,
  type Project,
  type Post,
  type SkillGroup,
} from './content'

export interface SiteContent {
  site: SiteConfig
  links: SiteLinks
  features: Feature[]
  projects: Project[]
  skillGroups: SkillGroup[]
  toolchain: string[]
  posts: Post[]
}

export const contentSections = [
  'site',
  'links',
  'features',
  'projects',
  'skillGroups',
  'toolchain',
  'posts',
] as const

export type ContentSection = (typeof contentSections)[number]

export function isContentSection(value: string): value is ContentSection {
  return (contentSections as readonly string[]).includes(value)
}

/** 各分区的中文名，后台界面与接口报错共用 */
export const sectionLabels: Record<ContentSection, string> = {
  site: '站点信息',
  links: '链接管理',
  features: '核心方向',
  projects: '项目作品',
  skillGroups: '技能分组',
  toolchain: '工具链',
  posts: '博客文章',
}

export const defaultContent: SiteContent = {
  site,
  links,
  features,
  projects,
  skillGroups,
  toolchain,
  posts,
}

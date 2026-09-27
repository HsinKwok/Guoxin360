/**
 * 站点链接配置：顶部导航、页头快捷入口、社交主页。
 *
 * 三组链接各有固定的展示位置（见各字段注释），后台「链接管理」面板按组维护。
 */

export interface NavItem {
  /** 菜单文字 */
  label: string
  /** 站内路由路径 */
  to: string
}

export interface ActionLink {
  label: string
  to: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface SiteLinks {
  /** 顶部导航：显示在页头主导航，以及页脚「站点导航」 */
  nav: NavItem[]
  /** 快捷入口：显示在页头右上角 */
  actions: ActionLink[]
  /** 社交链接：显示在页脚「站点导航」，以及联系方式页 */
  socials: SocialLink[]
}

export const links: SiteLinks = {
  nav: [
    { label: '首页', to: '/' },
    { label: '关于我', to: '/about' },
    { label: '技能', to: '/skills' },
    { label: '项目作品', to: '/projects' },
    { label: '博客', to: '/blog' },
    { label: '联系方式', to: '/contact' },
  ],
  actions: [
    { label: '我的作品', to: '/projects' },
    { label: '联系我', to: '/contact' },
  ],
  // 社交主页示例地址，后续由后台配置提供
  socials: [
    { label: 'GitHub', href: 'https://github.com/guoxin360' },
    { label: '掘金', href: 'https://juejin.cn/user/guoxin360' },
    { label: 'X / Twitter', href: 'https://x.com/guoxin360' },
  ],
}

/**
 * 站点全局配置：品牌、个人信息、SEO 默认值。
 *
 * 站点所有对外文案的唯一数据源。当前是示例默认值，
 * 后续接入后台后，把这里换成接口返回值、本文件留作兜底即可。
 * 链接类配置（导航、快捷入口、社交）见 ./links。
 */

export interface SiteConfig {
  brand: string
  name: string
  nameEn: string
  role: string
  tagline: string
  intro: string
  domain: string
  email: string
  location: string
  status: string
  avatar: string
  cover: string
  defaultTitle: string
  defaultDescription: string
  keywords: string
  /** 「关于我」正文，单个 Markdown 文本（段落之间空一行）。 */
  about: string
  principles: { title: string; desc: string }[]
  footerAbout: string
}

export const site: SiteConfig = {
  // 身份信息，后续由后台配置提供，当前为示例默认值
  brand: 'guoxin360',
  name: '张三',
  nameEn: 'Zhang San',
  role: '全栈开发者 / 独立创作者',
  tagline: '把想法做成一个能访问的地址',
  intro:
    '关注 Web 工程化、边缘计算与交互体验。白天把业务写稳，晚上折腾自己的小项目，顺手把踩过的坑记成文章。',
  domain: 'guoxin360.com',
  email: 'hello@example.com',
  location: '中国 · 城市',
  status: '开放远程合作与项目咨询',
  // 图片由文生图接口生成，替换时保持尺寸比例即可（头像方形、封面 16:9）
  avatar:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20portrait%20of%20a%20young%20East%20Asian%20software%20developer%2C%20soft%20studio%20lighting%2C%20minimal%20neutral%20gray%20background%2C%20sharp%20focus%2C%20high%20detail&image_size=square_hd',
  cover:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20dark%20technology%20background%2C%20glowing%20orange%20gradient%20mesh%2C%20subtle%20geometric%20grid%20lines%2C%20cinematic%20lighting%2C%20minimal%2C%20wide%20banner&image_size=landscape_16_9',
  defaultTitle: 'guoxin360 - 个人主页',
  defaultDescription:
    'guoxin360 的个人主页：全栈开发者的项目作品、技能栈与技术笔记，站点部署在 Cloudflare Workers 上。',
  keywords: 'guoxin360,个人主页,作品集,技术博客,全栈开发,Cloudflare Workers',
  about: `你好，我是张三，网名 guoxin360。一名全栈开发者，主要把时间花在 Web 前端和 Cloudflare 边缘服务上。

我习惯把一个想法从原型一路推到上线：画界面、写接口、配部署，再盯着监控把慢的地方一点点磨快。相比堆砌技术栈，我更在意「这件事有没有被真正解决」。

除了写代码，我也喜欢把复杂的东西讲清楚。这个站点既放作品，也放一些还没写完的思考。`,
  principles: [
    { title: '核心价值', desc: '好奇、克制、长期、开放' },
    { title: '工作方式', desc: '先跑通，再跑快，最后跑稳' },
    { title: '交付标准', desc: '说清楚、做完整、可维护' },
  ],
  footerAbout:
    '这里记录我的项目作品、技能栈和技术笔记。如果你有想法想落地，或者只是想聊聊，欢迎写信给我。',
}

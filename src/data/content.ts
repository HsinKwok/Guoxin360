/**
 * 站点内容数据：核心方向、项目作品、技能、博客文章。
 * 当前为示例内容，接入后台后改为从接口读取、本文件留作兜底即可。
 */

export interface Feature {
  title: string
  desc: string
}

export interface Project {
  slug: string
  name: string
  summary: string
  year: string
  tags: string[]
  /** 项目仓库或线上地址；留空时卡片不渲染跳转 */
  href?: string
}

export interface SkillGroup {
  title: string
  items: { name: string; level: number }[]
}

export interface Post {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  /** 整篇正文，单个 Markdown 文本（段落之间用空行分隔）。 */
  content: string
}

export const features: Feature[] = [
  {
    title: '前端工程',
    desc: 'React / TypeScript / 构建与性能优化，追求可维护的代码结构和顺滑的交互手感。',
  },
  {
    title: '边缘服务',
    desc: 'Cloudflare Workers / D1 / R2，让接口贴近用户，冷启动和延迟都更可控。',
  },
  {
    title: '内容表达',
    desc: '把项目复盘和技术笔记沉淀成文章，让踩过的坑可以被复用一次以上。',
  },
]

export const projects: Project[] = [
  {
    slug: 'edge-notes',
    name: 'edge-notes',
    summary: '基于 Cloudflare Workers + D1 的极简笔记服务，支持全文检索、离线草稿与 Markdown 导出。',
    year: '2026',
    tags: ['Cloudflare Workers', 'D1', 'TypeScript'],
    href: 'https://github.com/guoxin360/edge-notes',
  },
  {
    slug: 'mini-dashboard',
    name: 'mini-dashboard',
    summary: '面向个人站点的轻量数据面板，把访问量、构建状态和接口延迟收进一块屏幕。',
    year: '2025',
    tags: ['React', 'Vite', 'Charts'],
    href: 'https://github.com/guoxin360/mini-dashboard',
  },
  {
    slug: 'form-kit',
    name: 'form-kit',
    summary: '一套无依赖的表单校验方案，用声明式配置描述校验规则，体积不到 4KB。',
    year: '2025',
    tags: ['TypeScript', 'Library', 'Rollup'],
    href: 'https://github.com/guoxin360/form-kit',
  },
  {
    slug: 'markdown-blog',
    name: 'markdown-blog',
    summary: '把 Markdown 文件直接构建成静态博客的脚手架，支持本地预览和一键部署。',
    year: '2024',
    tags: ['Node.js', 'Markdown', 'CI/CD'],
    href: 'https://github.com/guoxin360/markdown-blog',
  },
  {
    slug: 'image-tools',
    name: 'image-tools',
    summary: '纯浏览器端的图片压缩与格式转换工具，所有处理都在本地完成，不上传任何文件。',
    year: '2024',
    tags: ['Canvas', 'WebAssembly'],
    href: 'https://github.com/guoxin360/image-tools',
  },
  {
    slug: 'ui-lab',
    name: 'ui-lab',
    summary: '自己常用的交互组件实验室，用于对比不同实现方案的性能与可访问性差异。',
    year: '2023',
    tags: ['React', 'A11y', 'Performance'],
    href: 'https://github.com/guoxin360/ui-lab',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    title: '前端',
    items: [
      { name: 'React', level: 92 },
      { name: 'TypeScript', level: 88 },
      { name: 'CSS / 响应式布局', level: 85 },
      { name: 'Vite 构建与调优', level: 80 },
    ],
  },
  {
    title: '服务端 / 边缘',
    items: [
      { name: 'Node.js', level: 82 },
      { name: 'Cloudflare Workers', level: 78 },
      { name: 'REST / 接口设计', level: 76 },
      { name: 'SQL（PostgreSQL / D1）', level: 72 },
    ],
  },
  {
    title: '工程化',
    items: [
      { name: 'Git / GitHub Actions', level: 85 },
      { name: '性能与可观测性', level: 76 },
      { name: '自动化测试', level: 70 },
      { name: '技术写作', level: 80 },
    ],
  },
]

export const toolchain: string[] = [
  'React',
  'TypeScript',
  'Vite',
  'Node.js',
  'Cloudflare Workers',
  'Hono',
  'D1',
  'Tailwind CSS',
  'GitHub Actions',
  'Vitest',
  'Playwright',
  'Figma',
]

export const posts: Post[] = [
  {
    slug: 'why-workers',
    title: '为什么我把个人站从服务器搬到了 Cloudflare Workers',
    date: '2026-08-12',
    summary: '一个静态页面加上两个接口，却要维护一台机器。搬到 Workers 之后，我关心的东西少了一半。',
    tags: ['Cloudflare', '部署'],
    content: `这个站点最早跑在一台 1C1G 的小机器上：Nginx 做静态托管，Node 起一个进程处理留言接口。日常够用，但每次改点东西都要 ssh 上去拉代码、重启进程，时间一长就懒得动了。

搬到 Cloudflare Workers 之后，流程变成了一条命令：构建产物和 Worker 脚本一起上传，静态资源交给边缘节点直接返回，动态请求才进入 Worker。我没有再为「这台机器还活着吗」操心过。

代价也有：Worker 的运行时有自己的约束，不能用完整的 Node API，本地调试要依赖 miniflare 这类工具。对于我这种「一个页面加几个接口」的站点来说，这笔交易很划算。

如果哪天复杂度真的上来了，再迁回容器也不算难——前提是业务逻辑别和运行时绑死。`,
  },
  {
    slug: 'css-architecture',
    title: '个人项目的 CSS 该怎么组织',
    date: '2026-06-30',
    summary: '不用框架也不写散装样式：一套命名规则加几十个变量，就够撑起一个中等规模的站点。',
    tags: ['CSS', '前端工程'],
    content: `个人项目最容易滑向两个极端：要么所有样式写在一个文件里，写着写着找不到自己三小时前定义的选择器；要么为了「规范」引入一整套方案，最后花在配置上的时间比写页面还多。

我现在的做法很朴素：先定一层设计变量（颜色、间距、圆角、容器宽度），再按「区块 + 元素」的粒度命名类，禁止用标签选择器去改布局。改主题色只需要动一行变量。

响应式方面，我把断点也写成变量并集中在文件末尾处理。这样看代码的时候，主流程永远是干净的桌面端样式，移动端只是覆盖。

这套规则撑不住大型团队协作，但对付个人站点绰绰有余，而且半年后回头看还认得出自己在写什么。`,
  },
  {
    slug: 'first-post',
    title: '写在开始之前',
    date: '2026-05-08',
    summary: '为什么要再开一个博客？因为想找一个不被打断的地方，把想法写完。',
    tags: ['随笔'],
    content: `很多年了，我的技术笔记散落在各种平台的草稿箱里，没有一篇是完整的。原因大同小异：写之前先想「会不会有人看」，于是越写越慢，最后干脆不写。

后来想通了。写作的第一读者应该是半年后的自己——那时我大概已经忘了当时为什么这么选，以及踩过哪些坑。

所以这个站点上的文章不追热点，也不保证深度。它更像一本公开的工作日志：做完一件事，把过程和判断记下来。

如果恰好对你有用，欢迎写信告诉我。`,
  },
]

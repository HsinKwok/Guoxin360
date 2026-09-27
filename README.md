# guoxin360

个人主页 / 作品集站点，前台展示 + 内置后台管理，整体部署在 Cloudflare 上。

- **前台**：首页、关于、技能、项目、博客（列表 + 详情）、留言。
- **后台**：`/admin` 登录后可在线编辑站点全部文案、项目、文章，并配置留言邮件的 SMTP。
- **内容存储**：D1 存「分区 → JSON」，缺省自动回退到代码内置默认值，首次部署无需灌种子数据。
- **单 Worker 架构**：`/api/*` 交给 Worker，其余请求走 Workers Assets 静态资源，未命中的导航请求回退到 `index.html`，因此 `/about`、`/projects` 等客户端路由可直接访问。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | React 19 · TypeScript · Vite 8 · React Router 7 |
| 渲染 | `marked` + `dompurify`（Markdown 正文） |
| 边缘 | Cloudflare Workers · Workers Assets · D1（SQLite） |
| 邮件 | `worker-mailer`（经 `cloudflare:sockets` 走 SMTP） |
| 构建 | `@cloudflare/vite-plugin` 一体化构建 Worker 与静态资源 |

## 目录结构

```
src/
  admin/          后台界面（登录、分区编辑、字段控件）
  components/     前台通用组件（Header / Footer / Layout / Markdown 等）
  data/           站点数据默认值（site / links / content / mail / defaults）
  hooks/          useContent（内容加载）、usePageMeta（SEO）
  pages/          前台页面（Home / About / Skills / Projects / Blog / Post / Contact）
  styles/         global.css
  worker/         Worker 端：路由入口、鉴权、会话、限流、内容读写、邮件
migrations/       D1 迁移脚本（0001 content / 0002 settings / 0003 rate_limits）
```

## 本地开发

```bash
npm install

# 复制变量模板并填入本地值（.dev.vars 不会被提交）
cp .dev.vars.example .dev.vars

# 初始化本地 D1（首次或迁移变更后执行）
npx wrangler d1 migrations apply guoxin360 --local

# 启动开发服务器（同时跑前端与 Worker，默认 http://localhost:5173）
npm run dev
```

> `.dev.vars` 里 `ENVIRONMENT=development` 时允许使用示例凭据。**线上不要设置该变量**，否则会被当作生产环境处理。

常用校验：

```bash
npm run typecheck   # TypeScript 类型检查
npm run build       # 产出 dist/guoxin360（Worker）与 dist/client（静态资源）
npm run preview     # 本地预览构建产物
```

## 环境变量与密钥

`ADMIN_PASSWORD`、`SESSION_SECRET` 属敏感信息，**只放在本地 `.dev.vars` 与线上 secret**，绝不写进仓库。

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 后台登录密码。 |
| `SESSION_SECRET` | 是 | 会话 Cookie 的 HMAC 签名密钥，可用 `openssl rand -base64 32` 生成；与本地必须不同。 |
| `CONTACT_TO` | 是 | 留言收件邮箱。为空时 `/api/contact` 返回「邮件服务尚未配置」。 |
| `ENVIRONMENT` | 否 | 仅本地 `.dev.vars` 设为 `development`；线上不设。 |
| `LOGIN_RATE_LIMIT` | 否 | 登录限流，格式 `次数/秒数`，默认 `10/900`（15 分钟 10 次）。 |
| `CONTACT_RATE_LIMIT` | 否 | 留言限流，格式 `次数/秒数`，默认 `5/3600`（1 小时 5 次）。 |

**占位凭据黑名单（fail-safe）**：`ADMIN_PASSWORD` / `SESSION_SECRET` 若仍为模板示例值（如 `admin123456`、`change-me-admin-password`），非开发环境会直接拒绝登录与会话校验。上线前务必用 `wrangler secret put` 覆盖。

写入线上 secret：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put CONTACT_TO

# 可选：覆盖限流阈值
npx wrangler secret put LOGIN_RATE_LIMIT
npx wrangler secret put CONTACT_RATE_LIMIT
```

> 留言的实际投递还需在后台「邮件设置」中填写 SMTP 主机、端口、账号与密码（存于 D1 的 `settings` 表，公开接口不会返回）。

## 数据库（D1）

`wrangler.jsonc` 已绑定名为 `guoxin360` 的 D1。若需在新账号下重建：

```bash
# 创建数据库，把输出的 database_id 填回 wrangler.jsonc
npx wrangler d1 create guoxin360

# 应用迁移
npx wrangler d1 migrations apply guoxin360 --local    # 本地
npx wrangler d1 migrations apply guoxin360 --remote   # 线上
```

三张表：`content`（分区 JSON）、`settings`（SMTP 配置等私密项）、`rate_limits`（限流计数）。表内无对应行时接口回退到代码内置默认内容，后台「恢复默认」即删除该行。

## 部署

```bash
# 1. 登录 Cloudflare 账号
npx wrangler login

# 2. 写入线上密钥（首次或轮换时执行，见上节）
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put CONTACT_TO

# 3. 应用线上数据库迁移
npx wrangler d1 migrations apply guoxin360 --remote

# 4. 构建并部署
npm run deploy          # = npm run build && wrangler deploy
```

部署后可验证：

```bash
curl https://guoxin360.com/api/health   # {"ok":true,...}
```

自定义域由 `wrangler.jsonc` 的 `routes` 声明（`guoxin360.com`、`www.guoxin360.com`），部署时会在 zone 内自动创建 DNS 记录并绑定本 Worker。

> **注意**：`CONTACT_TO` 不再写在 `wrangler.jsonc` 中。每次 `npm run deploy` 都会以当前配置为准，因此部署前务必先执行 `npx wrangler secret put CONTACT_TO`，否则线上该变量会被清空、留言收件失效。

## npm 脚本

| 脚本 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器（前端 + Worker） |
| `npm run build` | 类型检查并构建产物 |
| `npm run typecheck` | 仅做 TypeScript 类型检查 |
| `npm run preview` | 预览构建产物 |
| `npm run deploy` | 构建并部署到 Cloudflare |

## 接口一览

公开：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/content` | 返回整站内容（D1 覆盖 + 内置默认） |
| POST | `/api/contact` | 提交留言（限流 + 邮件发送） |

鉴权：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/auth/session` | 查询当前会话是否有效 |
| POST | `/api/auth/login` | 登录（限流 + 签发会话 Cookie） |
| POST | `/api/auth/logout` | 登出（服务端提升会话世代，立即作废所有令牌） |

后台（需登录）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/content` | 读取全部内容 |
| PUT | `/api/admin/content/{section}` | 保存某分区（校验数据结构） |
| DELETE | `/api/admin/content/{section}` | 恢复某分区为默认值 |
| GET | `/api/admin/mail` | 读取邮件设置（不回传密码，仅返回 `passwordSet`） |
| PUT | `/api/admin/mail` | 保存邮件设置 |

`{section}` 取值：`site`、`links`、`features`、`projects`、`skillGroups`、`toolchain`、`posts`。

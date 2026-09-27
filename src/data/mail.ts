/**
 * 留言邮件的 SMTP 配置。
 *
 * 这份数据只存在服务端（D1 的 settings 表），不会通过公开的 /api/content 返回；
 * 后端编辑界面拿到的是 MailSettingsView —— 不含密码，只告诉前端密码是否已设置。
 */

interface MailSettings {
  host: string
  /** 端口存成字符串：它来自表单输入，由服务端校验后转成数字。 */
  port: string
  /** true = 隐式 SSL/TLS（一般 465）；false = 明文连接后 STARTTLS（一般 587）。 */
  secure: boolean
  username: string
  fromName: string
  fromEmail: string
}

/** D1 里实际存的形式：比 MailSettings 多一个密码。 */
export interface StoredMailSettings extends MailSettings {
  password: string
}

/** 后台拿到的形式：密码永远不回传，只标记是否已设置。 */
export interface MailSettingsView extends MailSettings {
  passwordSet: boolean
}

export const emptyMailSettings: StoredMailSettings = {
  host: '',
  port: '465',
  secure: true,
  username: '',
  password: '',
  fromName: '',
  fromEmail: '',
}

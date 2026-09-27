-- 「设置」类数据（区别于面向访客的 content 分区）。
--
-- 目前只存留言邮件的 SMTP 配置：里面有密码，属于敏感信息，
-- 所以不放进 content 表 —— 公开的 /api/content 永远不会把它带出去。
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

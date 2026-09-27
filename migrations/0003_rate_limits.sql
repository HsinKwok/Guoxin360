-- 固定窗口限流计数：登录与留言接口按 IP 限流，防暴力破解与垃圾邮件刷发信。
--
-- key      = 限流桶（如 login:<ip> / contact:<ip>）
-- count    = 当前窗口内已计数次数
-- reset_at = 窗口重置时间（Unix 秒），到达后下一次请求把计数归零
CREATE TABLE IF NOT EXISTS rate_limits (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

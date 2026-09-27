-- 站点内容以「分区 + JSON」的形式存放：
--   key   = 分区名（site / features / projects / skillGroups / toolchain / posts）
--   value = 该分区的完整 JSON
--
-- 表里没有对应行时，接口回退到代码内置的默认内容，
-- 因此首次部署不需要灌任何种子数据；后台点「恢复默认」也只是删除该行。
CREATE TABLE IF NOT EXISTS content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

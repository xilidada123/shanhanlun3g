# 修订审批服务

Cloudflare Worker: shanghan-api
D1: shanghan-revisions

前端通过 cloud.js 连接公开题库及修订接口。管理员密码的 PBKDF2 验证记录保存在 Worker 的 PASSWORD_RECORD Secret 中，管理员账号为 ADMIN_USER 绑定。仓库不保存密码、验证记录或会话令牌。

用户提交修订后进入 pending；管理员审核或直接修改通过版本校验及数据库事务更新已发布条文。会话有效期两小时，退出后立即撤销。

公共接口：GET /data；POST /submit、/login。
管理员接口：POST /pending、/approve、/reject、/apply、/logout。

部署更新 Worker 时需保留 DB、ADMIN_USER、PASSWORD_RECORD 绑定，勿用空绑定覆盖现有部署。修改前可通过前端“导出完整题库”备份公开版本。

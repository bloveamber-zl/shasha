# 会话交接

## 当前已验证

- 现在明确可用的部分：
  - `./init.sh` 可作为标准入口运行 quick 校验。
  - 小程序工程骨架、5 个 tab 页面、森林守护灵主题素材和云函数占位已落地。
  - 账本核心工具的金额解析、格式化、记录创建、汇总、筛选和日期分组已有 Node 测试。
  - 自动化视觉冒烟脚本已接入，但等待微信开发者工具服务端口开启。
- 这轮实际跑过的验证：
  - `npm test`
  - `npm run lint`
  - `./init.sh`
  - `npm run visual:smoke` 已运行但失败于服务端口未开启。

## 本轮改动

- 新增了哪些代码、页面、云函数或行为：
  - 新增首页、记账页、图表页、明细页、我的页。
  - 新增原创森林守护灵主题素材：`forest-header.png`、`forest-guardian.png`、`ledger-success.png`。
  - 新增 `initUser`、`ledgerQuery`、`ledgerWrite` 云函数占位。
- 数据库集合、权限规则或云环境发生了哪些变化：
  - 新增 `docs/cloud-schema.md`，记录 users、categories、accounts、ledger_records、budgets、tags 设计。
  - 尚未创建真实云数据库集合和权限规则。
- 基础设施或 harness 发生了哪些变化：
  - `./init.sh` 默认从 docs 校验升级为 quick 校验。
  - 新增 `scripts/validate-project.js`、`package.json`、`tests/ledger.test.js`。
  - 新增 `scripts/visual-smoke.js`、`scripts/visual-smoke-core.js`、`tests/visual-smoke-core.test.js`、`docs/visual-acceptance.md`。

## 仍损坏或未验证

- 已知缺陷：
  - 暂无本地验证发现的代码缺陷。
- 未验证路径：
  - 微信开发者工具导入、编译、预览。
  - 真机/模拟器视觉检查。
  - 云函数部署和真实云环境调用。
  - 自动化视觉截图：当前卡在微信开发者工具服务端口未开启。
- 云函数、云数据库或权限规则风险：
  - 云函数未部署，集合未创建，权限规则未配置。
  - 客户端当前使用 mock 数据，刷新不持久化。
- 下一轮会话需要注意的风险：
  - 不要把 `blocked` 状态改成 `passing`，除非完成微信开发者工具和云开发验证。
  - `npm run visual:smoke` 需要先开启微信开发者工具 设置 -> 安全 -> 服务端口。

## 下一步最佳动作

- 最高优先级未完成功能：
  - `scaffold-20260428-001`
  - `ui-theme-20260428-007`
  - `visual-20260428-008`
- 为什么它是下一步：
  - 工程骨架已可编译；主题和自动化截图缺少视觉证据。
- 什么结果才算 passing：
  - 微信开发者工具成功导入并编译。
  - 首页、记账、图表、明细、我的均可访问。
  - 三张素材正常显示。
  - 无明显文字溢出、遮挡或空白素材。
  - `npm run visual:smoke` 生成 5 张非空截图。
- 这一步中哪些东西不要动：
  - 不要引入真实密钥。
  - 不要扩大到完整云端持久化，除非另开 `cloud-20260428-002`。

## 命令

- 启动命令：
  - 用微信开发者工具导入 `/Users/Lin/project/shasha`
- 验证命令：
  - `./init.sh`
  - `npm test`
  - `npm run lint`
  - `npm run visual:smoke`
  - `npm run visual:smoke:debug`
- 定向调试命令：
  - `VERIFY_MODE=quick ./init.sh`
- 微信开发者工具验证路径：
  - 导入项目后依次打开：首页、记一笔、图表、明细、我的。

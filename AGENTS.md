# AGENTS.md

这个仓库面向“沙沙记账”微信小程序：每日记账、图表展示、多维度观察；后端使用微信小程序云开发能力。

## 沟通规则

- 中文回复，言简意赅，必要时巧用 Emoji。
- 减少无关构建；本项目不跑 Xcode Build。
- 按需使用 Plan Mode 或 Subagent。
- 若编码任务需要 skill：优先使用 superpowers；若环境提供 karpathy-guidelines，也按需使用。

## 开工流程

写代码前先做这些事：

1. 用 `pwd` 确认当前目录是 `/Users/Lin/project/shasha`。
2. 读取 `docs/coding-progress.md`，了解当前已验证状态和下一步。
3. 读取 `docs/feature_list.json`，选择优先级最高的未完成功能。
4. 用 `git log --oneline -5` 看最近提交；若仓库还没有提交，记录这个事实即可。
5. 运行 `./init.sh`。
6. 如果基础验证一开始就失败，先修基础状态，不要在坏的起点上继续叠新功能。

## 工作规则

- 一次只做一个功能；同一时间 `docs/feature_list.json` 里只能有一个 `in_progress`。
- 不要因为“代码写完了”就把功能标记为 `passing`，必须有验证证据。
- 除非为了消除当前 blocker 的窄范围修复，否则不要扩大到其他功能。
- 不要悄悄改弱验证规则，不要删除失败用例来制造通过。
- 优先依赖仓库里的持久化文件，而不是聊天记录。
- 不提交密钥、云开发环境私密配置、支付配置、微信 AppSecret、CI 私钥。
- 修改云函数、数据库集合、权限规则时，同步更新任务记录和验证证据。

## 小程序与云开发约束

- 前端优先按微信小程序原生结构组织：`miniprogram/`、`pages/`、`components/`、`utils/`、`app.json`。
- 后端优先按云开发结构组织：`cloudfunctions/`、云数据库集合、云存储、权限规则。
- 记账数据模型要稳定：金额、收支类型、分类、账户、日期、标签、备注、创建/更新时间、用户归属字段不可随意破坏。
- 图表和统计逻辑要有可复现样例数据，避免只用空数据或单条数据验证。
- 云函数必须处理鉴权、参数校验、错误返回和幂等边界。

## 推荐验证

标准入口是：

```bash
./init.sh
```

按任务需要补充：

- 微信开发者工具：导入、编译、预览、真机调试。
- `VERIFY_MODE=quick ./init.sh`：项目脚手架存在后运行更完整的本地快速验证。
- `VERIFY_MODE=full ./init.sh`：需要时运行脚本中可发现的测试、lint 或 CI 校验。
- 云函数本地测试或云端调用验证：记录函数名、输入、输出和失败边界。

## 必需文件

- `docs/feature_list.json`：功能状态的唯一事实来源。
- `docs/coding-progress.md`：会话进度和当前已验证状态。
- `init.sh`：统一启动与验证入口。
- `docs/session-handoff.md`：较长会话可选的交接摘要。
- `docs/clean-state-checklist.md`：收尾检查清单。

## 完成定义

一个功能只有在以下条件都满足时才算完成：

- 目标行为已经实现。
- 客户端、云函数、数据库或权限规则的影响边界已说明。
- 要求的验证真的跑过。
- 验证证据记录在 `docs/feature_list.json` 或 `docs/coding-progress.md`。
- 仓库仍然能按标准启动路径重新开始工作。

## 收尾

结束会话前：

1. 更新 `docs/coding-progress.md`。
2. 更新 `docs/feature_list.json`。
3. 记录仍未解决的风险或 blocker。
4. 确认 `./init.sh` 的结果或说明为什么未运行。
5. 若提交 Git，commit 信息使用中文，并按类型开头，例如 `feat:`、`fix:`、`optimize:`、`docs:`。


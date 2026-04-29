# 微信云开发数据结构

## 集合

- `users`：用户资料和最近访问时间。
- `categories`：用户自定义分类，默认分类由客户端第一版提供。
- `accounts`：账户列表，如微信、支付宝、银行卡、现金。
- `ledger_records`：记账流水。
- `budgets`：预算，后续实现。
- `budgets`：预算配置，第一版客户端使用本地默认配置，后续可迁移到云端。
- `tags`：标签，后续实现。

## `ledger_records` 字段

- `openid`：用户归属，云函数写入。
- `amountCents`：金额，单位为分，避免浮点误差。
- `type`：`income` 或 `expense`。
- `category`：分类名称。
- `account`：账户名称。
- `date`：账单日期，格式 `YYYY-MM-DD`。
- `tags`：字符串数组。
- `note`：备注。
- `createdAt`：创建时间。
- `updatedAt`：更新时间。

## 权限原则

- 客户端不直接跨用户读写账单。
- 写入统一经过 `ledgerWrite` 云函数。
- 查询统一经过 `ledgerQuery` 云函数。
- 后续接入真实环境时，数据库权限规则必须限制用户只能访问自己的 `openid` 数据。

## 云函数

- `initUser`：根据当前微信上下文初始化或更新用户访问时间。
- `ledgerQuery`：按当前 `openid` 查询账单，支持 `type`、`category`、`startDate`、`endDate`。
- `ledgerWrite`：支持 `create`、`update`、`delete`，写入前校验参数，更新/删除前校验记录归属。

## `budgets` 字段草案

- `openid`：用户归属，后续云端预算配置写入。
- `type`：`month` 或 `category`。
- `amountCents`：预算金额，单位为分。
- `category`：分类预算对应的分类名称，月度总预算为空。
- `createdAt`：创建时间。
- `updatedAt`：更新时间。

## 客户端策略

- 小程序启动时调用 `initUser` 和 `ledgerQuery`。
- 云函数调用成功后，页面使用云端 `ledger_records`。
- 云函数不可用、未部署或权限错误时，自动回落到本地 mock 数据，并在首页/我的页显示“云同步失败，已使用本地数据”。

# 微信云开发数据结构

## 集合

- `users`：用户资料和最近访问时间。
- `categories`：用户自定义分类，默认分类由客户端第一版提供。
- `accounts`：账户列表，如微信、支付宝、银行卡、现金。
- `ledger_records`：记账流水。
- `budgets`：预算，后续实现。
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


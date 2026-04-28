# 微信云开发部署说明

## 前置

1. 微信开发者工具中选择云开发环境。
2. 不提交 AppSecret、私钥、生产环境密钥。
3. 确认 `project.config.json` 已配置 `miniprogramRoot` 和 `cloudfunctionRoot`。

## 创建集合

在云开发控制台创建这些集合：

- `users`
- `categories`
- `accounts`
- `ledger_records`
- `budgets`
- `tags`

当前第一版真实读写依赖：

- `users`
- `ledger_records`

## 部署云函数

在微信开发者工具中依次上传并部署：

- `cloudfunctions/initUser`
- `cloudfunctions/ledgerQuery`
- `cloudfunctions/ledgerWrite`

部署后，在云函数测试面板验证 `initUser`：

```json
{}
```

验证 `ledgerQuery`：

```json
{
  "type": "expense"
}
```

验证 `ledgerWrite` 创建：

```json
{
  "action": "create",
  "record": {
    "amountCents": 2860,
    "type": "expense",
    "category": "餐饮",
    "account": "微信",
    "date": "2026-04-28",
    "tags": ["午餐"],
    "note": "便当"
  }
}
```

## 验收

1. 运行 `./init.sh`。
2. 微信开发者工具重新编译。
3. 打开首页，云状态应显示“云开发已就绪”。
4. 在“记一笔”新增支出。
5. 重新编译或刷新小程序。
6. 明细页仍能看到刚新增的记录。
7. 云数据库 `ledger_records` 中该记录带有 `openid`。
8. 使用非法金额或非法日期调用 `ledgerWrite`，应返回可读错误码。

## 已知边界

- 当前页面只接入新增记录，编辑和删除 UI 会在后续 `ledger-20260428-003` 中补齐。
- 当前集合权限建议先保持云函数访问，避免客户端直连跨用户数据。
- 如果云函数未部署，客户端会自动回退到本地预览数据。

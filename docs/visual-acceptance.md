# 自动化视觉验收

## 目标

自动打开小程序 5 个核心页面并截图，快速发现白屏、页面打不开、资源缺失、明显布局崩坏等问题。

## 前置条件

1. 微信开发者工具已安装。
2. 微信开发者工具服务端口已开启：设置 -> 安全 -> 服务端口。
3. 安装项目依赖：

```bash
npm install
```

如果微信开发者工具 CLI 不在默认路径，设置环境变量：

```bash
export WECHAT_DEVTOOLS_CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
```

如果脚本提示自动化端口连接超时，先手动确认：

```text
微信开发者工具 -> 设置 -> 安全 -> 服务端口：开启
```

需要看 CLI 详细输出时运行：

```bash
npm run visual:smoke:debug
```

## 执行

```bash
npm run visual:smoke
```

脚本会：

- 读取 `miniprogram/app.json` 的页面清单。
- 依次 `reLaunch` 到每个页面。
- 截图保存到 `tests/visual/screenshots/`。
- 检查截图文件非空。

## 验收结果

截图文件名示例：

- `pages-home-home.png`
- `pages-ledger-ledger.png`
- `pages-charts-charts.png`
- `pages-details-details.png`
- `pages-mine-mine.png`

当前阶段截图作为人工复核材料，不做强制像素差异比较。等页面稳定后再建立 baseline 和 diff 阈值。

## 不能替代的检查

自动化截图不能完全判断审美质量。仍需人工确认：

- 插画氛围是否符合预期。
- 页面信息密度是否舒适。
- 文案是否顺眼。
- 小屏和大屏下是否存在轻微拥挤。

# 底部 TabBar 图标说明

## 用途

这些图标用于微信小程序 `miniprogram/app.json` 的底部 `tabBar`，覆盖首页、记一笔、图表、明细、我的 5 个入口。

## 输出文件

- `miniprogram/assets/tabbar/home-default.png`
- `miniprogram/assets/tabbar/home-selected.png`
- `miniprogram/assets/tabbar/ledger-default.png`
- `miniprogram/assets/tabbar/ledger-selected.png`
- `miniprogram/assets/tabbar/charts-default.png`
- `miniprogram/assets/tabbar/charts-selected.png`
- `miniprogram/assets/tabbar/details-default.png`
- `miniprogram/assets/tabbar/details-selected.png`
- `miniprogram/assets/tabbar/mine-default.png`
- `miniprogram/assets/tabbar/mine-selected.png`

所有输出均为 `81x81` PNG，并带透明通道。

## 生成诉求

使用 `$imagegen` 生成一张 5 列 x 2 行的图标表，再裁切成小程序可用的 tabbar 图标。

提示词核心诉求：

```text
Generate a clean icon sheet containing 10 small WeChat Mini Program bottom tabbar icons for Shasha Ledger.
Top row is inactive state, bottom row is selected state.
The icons will be cropped into individual 81x81 PNG tabbar assets.
Tabs: Home, Add ledger entry, Charts, Details list, Profile.
Style: soft hand-drawn mobile UI icon, rounded shapes, simple silhouette, cute forest bookkeeping theme.
Inactive color: #8A7B63. Selected color: #4F8F62.
Constraints: transparent background, no text, no watermark, no complex scenes, legible at 24px tabbar size.
Avoid: Totoro, Ghibli, Miyazaki style imitation, copyrighted characters.
```

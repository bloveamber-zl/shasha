# 工作流使用指南

这套文件参考 `/Users/Lin/project/lepai` 的 agent 工作流，并适配当前“每日记账 + 图表分析 + 微信云开发后端”的小程序项目。

## 核心文件

1. `AGENTS.md`：根指令文件，定义开工流程、工作规则、完成定义和收尾要求。
2. `init.sh`：统一验证入口；当前支持空仓库阶段，后续接入小程序脚手架后自动发现 `package.json`、`miniprogram/`、`cloudfunctions/`。
3. `docs/feature_list.json`：功能状态唯一事实来源。
4. `docs/coding-progress.md`：每轮会话的进度日志。
5. `docs/session-handoff.md`：长会话或复杂状态交接模板。
6. `docs/clean-state-checklist.md`：结束会话前的安全检查。
7. `docs/evaluator-rubric.md`：里程碑或代码评审时的评分表。

## 标准开工

```bash
pwd
sed -n '1,220p' docs/coding-progress.md
python3 -m json.tool docs/feature_list.json >/dev/null
git log --oneline -5
./init.sh
```

如果 `git log` 因为没有提交而失败，记录“仓库尚无提交”即可。

## 标准收尾

1. 更新 `docs/coding-progress.md`。
2. 更新 `docs/feature_list.json`。
3. 运行 `./init.sh` 或记录未运行原因。
4. 检查 `docs/clean-state-checklist.md`。
5. 若提交，使用中文 commit log，例如 `docs: 初始化沙沙记账小程序工作流`。

## 状态规则

- `not_started`：还没开始。
- `in_progress`：当前唯一正在做的任务。
- `blocked`：有明确阻塞，暂时无法继续。
- `passing`：验证通过，且证据已记录。

任何功能标记为 `passing` 前，都必须有可追溯证据。


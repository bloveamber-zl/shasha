#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PACKAGE_MANAGER="${PACKAGE_MANAGER:-npm}"
INSTALL_MODE="${INSTALL_MODE:-skip}"
VERIFY_MODE="${VERIFY_MODE:-quick}"

echo "==> 当前目录: $PWD"
echo "==> 验证模式: VERIFY_MODE=$VERIFY_MODE"
echo "==> 依赖模式: INSTALL_MODE=$INSTALL_MODE"

require_bin() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1" >&2
    exit 1
  fi
}

json_check() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "缺少 JSON 文件: $file" >&2
    exit 1
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool "$file" >/dev/null
  elif command -v node >/dev/null 2>&1; then
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$file"
  else
    echo "未找到 python3 或 node，跳过 JSON 语法校验: $file"
    return 0
  fi

  echo "==> JSON 校验通过: $file"
}

has_npm_script() {
  local package_json="$1"
  local script_name="$2"

  command -v node >/dev/null 2>&1 || return 1
  node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.exit(p.scripts && p.scripts[process.argv[2]] ? 0 : 1)" "$package_json" "$script_name"
}

run_script_if_present() {
  local dir="$1"
  local script_name="$2"

  if [ ! -f "$dir/package.json" ]; then
    return 0
  fi

  if has_npm_script "$dir/package.json" "$script_name"; then
    echo "==> 运行脚本: $dir -> $PACKAGE_MANAGER run $script_name"
    (cd "$dir" && "$PACKAGE_MANAGER" run "$script_name")
  else
    echo "==> 未配置脚本，跳过: $dir -> $script_name"
  fi
}

install_if_requested() {
  local dir="$1"

  if [ ! -f "$dir/package.json" ]; then
    return 0
  fi

  case "$INSTALL_MODE" in
    skip)
      echo "==> 跳过依赖安装: $dir"
      ;;
    install)
      echo "==> 安装依赖: $dir"
      (cd "$dir" && "$PACKAGE_MANAGER" install)
      ;;
    ci)
      echo "==> CI 安装依赖: $dir"
      (cd "$dir" && "$PACKAGE_MANAGER" ci)
      ;;
    *)
      echo "不支持的 INSTALL_MODE: $INSTALL_MODE" >&2
      echo "可选值: skip | install | ci" >&2
      exit 1
      ;;
  esac
}

verify_docs() {
  json_check "docs/feature_list.json"

  for file in AGENTS.md docs/coding-progress.md docs/session-handoff.md docs/clean-state-checklist.md; do
    if [ ! -f "$file" ]; then
      echo "缺少工作流文件: $file" >&2
      exit 1
    fi
  done

  echo "==> 工作流文档存在"
}

verify_project_shape() {
  if [ -f "project.config.json" ]; then
    json_check "project.config.json"
    echo "==> 检测到微信小程序配置: project.config.json"
  else
    echo "==> 尚未检测到 project.config.json，项目代码可能还未初始化"
  fi

  if [ -d "miniprogram" ]; then
    echo "==> 检测到小程序目录: miniprogram/"
  else
    echo "==> 尚未检测到小程序目录: miniprogram/"
  fi

  if [ -d "cloudfunctions" ]; then
    echo "==> 检测到云函数目录: cloudfunctions/"
  else
    echo "==> 尚未检测到云函数目录: cloudfunctions/"
  fi
}

verify_node_packages() {
  install_if_requested "."
  run_script_if_present "." "lint"
  run_script_if_present "." "test"

  if [ -d "miniprogram" ]; then
    install_if_requested "miniprogram"
    run_script_if_present "miniprogram" "lint"
    run_script_if_present "miniprogram" "test"
  fi

  if [ -d "cloudfunctions" ]; then
    while IFS= read -r package_json; do
      fn_dir="$(dirname "$package_json")"
      install_if_requested "$fn_dir"
      run_script_if_present "$fn_dir" "test"
      run_script_if_present "$fn_dir" "lint"
    done < <(find cloudfunctions -mindepth 2 -maxdepth 2 -name package.json -print)
  fi
}

case "$VERIFY_MODE" in
  docs)
    verify_docs
    verify_project_shape
    ;;
  quick)
    verify_docs
    verify_project_shape
    verify_node_packages
    ;;
  full)
    verify_docs
    verify_project_shape
    verify_node_packages
    echo "==> 如已配置 miniprogram-ci，请在对应 npm script 中接入 preview/upload 校验"
    ;;
  skip)
    echo "==> 跳过验证"
    ;;
  *)
    echo "不支持的 VERIFY_MODE: $VERIFY_MODE" >&2
    echo "可选值: docs | quick | full | skip" >&2
    exit 1
    ;;
esac

cat <<'EOF'
==> 推荐启动方式
    1. 用微信开发者工具导入当前目录
    2. 选择已配置的云开发环境
    3. 编译小程序并按功能清单做手工或自动验证

提示:
    - 当前脚本默认运行 quick 校验但不安装依赖，避免无意联网；需要时运行 INSTALL_MODE=install ./init.sh
    - 项目脚手架建立后，优先把 lint/test/miniprogram-ci 接入 package.json scripts
EOF

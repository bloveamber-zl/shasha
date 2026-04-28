#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const {
  buildCliAutoArgs,
  ensureDir,
  getLaunchTimeoutMs,
  getVisualPort,
  getVisualConfig,
  resolveCliPath,
  toScreenshotName
} = require('./visual-smoke-core');

const rootDir = path.resolve(__dirname, '..');
const config = getVisualConfig(rootDir);

function loadAutomator() {
  try {
    return require('miniprogram-automator');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('缺少依赖: miniprogram-automator');
      console.error('请先运行: npm install');
      console.error('如果微信开发者工具 CLI 不在默认路径，请设置 WECHAT_DEVTOOLS_CLI=/path/to/cli');
      process.exit(1);
    }
    throw error;
  }
}

async function run() {
  const cliPath = resolveCliPath();
  if (!cliPath) {
    console.error('未找到微信开发者工具 CLI。');
    console.error('请设置环境变量，例如: WECHAT_DEVTOOLS_CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"');
    process.exit(1);
  }

  const automator = loadAutomator();
  ensureDir(config.outputDir);
  const port = getVisualPort();
  const timeout = getLaunchTimeoutMs();

  const args = buildCliAutoArgs(config.projectPath, port);
  const cliProcess = childProcess.spawn(cliPath, args, {
    stdio: process.env.VISUAL_SMOKE_DEBUG ? 'inherit' : 'ignore'
  });

  const miniProgram = await connectWithRetry(automator, port, timeout);

  try {
    for (const page of config.pages) {
      const currentPage = await miniProgram.reLaunch(page.path);
      await currentPage.waitFor(700);

      const screenshotPath = path.join(config.outputDir, toScreenshotName(page.path));
      await miniProgram.screenshot({
        path: screenshotPath
      });

      const info = fs.statSync(screenshotPath);
      if (info.size <= 0) {
        throw new Error(`截图为空: ${screenshotPath}`);
      }

      const rootElement = await currentPage.$('page');
      if (!rootElement) {
        throw new Error(`页面根节点缺失: ${page.path}`);
      }

      console.log(`已截图: ${page.path} -> ${screenshotPath}`);
    }
  } finally {
    await miniProgram.close();
    cliProcess.kill();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(automator, port, timeout) {
  const startedAt = Date.now();
  const wsEndpoint = `ws://127.0.0.1:${port}`;
  let lastError;

  while (Date.now() - startedAt < timeout) {
    try {
      return await automator.connect({ wsEndpoint });
    } catch (error) {
      lastError = error;
      await sleep(1000);
    }
  }

  throw new Error(`连接微信开发者工具自动化端口超时: ${wsEndpoint}\n${lastError ? lastError.message : ''}`);
}

run().catch((error) => {
  console.error('自动化视觉验收失败。');
  console.error('请确认微信开发者工具 -> 设置 -> 安全 -> 服务端口 已开启。');
  console.error('如需查看微信开发者工具 CLI 输出，请运行: npm run visual:smoke:debug');
  console.error(error);
  process.exit(1);
});

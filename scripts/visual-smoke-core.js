const fs = require('node:fs');
const path = require('node:path');

function getCliCandidates(platform = process.platform) {
  if (platform !== 'darwin') return [];

  return [
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    '/Applications/微信开发者工具.app/Contents/MacOS/cli'
  ];
}

function resolveCliPath({ env = process.env, platform = process.platform, existsSync = fs.existsSync } = {}) {
  if (env.WECHAT_DEVTOOLS_CLI) return env.WECHAT_DEVTOOLS_CLI;
  if (env.MINIPROGRAM_CLI) return env.MINIPROGRAM_CLI;

  return getCliCandidates(platform).find((candidate) => existsSync(candidate)) || '';
}

function toScreenshotName(pagePath) {
  return `${pagePath.replace(/^\/+/, '').replace(/\/+/g, '-')}.png`;
}

function getLaunchTimeoutMs(env = process.env) {
  const parsed = Number(env.VISUAL_SMOKE_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
}

function getVisualPort(env = process.env) {
  const parsed = Number(env.VISUAL_SMOKE_PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 9420;
}

function buildCliAutoArgs(projectPath, port) {
  return [
    'auto',
    '--project',
    projectPath,
    '--port',
    String(port),
    '--trust-project'
  ];
}

function buildVisualPages(appConfig) {
  return (appConfig.pages || []).map((pagePath) => {
    const segments = pagePath.split('/');
    return {
      name: segments[segments.length - 1],
      path: `/${pagePath}`
    };
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getVisualConfig(rootDir) {
  const appConfig = readJson(path.join(rootDir, 'miniprogram/app.json'));
  const outputDir = path.join(rootDir, 'tests/visual/screenshots');

  return {
    projectPath: rootDir,
    outputDir,
    pages: buildVisualPages(appConfig)
  };
}

module.exports = {
  buildVisualPages,
  buildCliAutoArgs,
  ensureDir,
  getCliCandidates,
  getLaunchTimeoutMs,
  getVisualPort,
  getVisualConfig,
  resolveCliPath,
  toScreenshotName
};

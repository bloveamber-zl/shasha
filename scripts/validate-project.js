const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function requireFile(file) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    fail(`缺少文件: ${file}`);
  }
}

function requirePng(file, { width, height, alpha } = {}) {
  const fullPath = path.join(root, file);
  requireFile(file);

  const buffer = fs.readFileSync(fullPath);
  const isPng = buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng) {
    fail(`不是 PNG 文件: ${file}`);
    return;
  }

  const actualWidth = buffer.readUInt32BE(16);
  const actualHeight = buffer.readUInt32BE(20);
  const colorType = buffer[25];

  if (width && actualWidth !== width) {
    fail(`PNG 宽度不符合预期: ${file}，实际 ${actualWidth}，预期 ${width}`);
  }

  if (height && actualHeight !== height) {
    fail(`PNG 高度不符合预期: ${file}，实际 ${actualHeight}，预期 ${height}`);
  }

  if (alpha && colorType !== 4 && colorType !== 6) {
    fail(`PNG 缺少透明通道: ${file}`);
  }
}

function readJson(file) {
  const fullPath = path.join(root, file);
  requireFile(file);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function walkFiles(dir, predicate, acc = []) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return acc;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(rel, predicate, acc);
    } else if (predicate(rel)) {
      acc.push(rel);
    }
  }

  return acc;
}

requireFile('AGENTS.md');
requireFile('project.config.json');
requireFile('miniprogram/app.json');
requireFile('miniprogram/app.js');
requireFile('miniprogram/app.wxss');
requireFile('miniprogram/utils/cloud-ledger.js');
requireFile('miniprogram/utils/cloud-ledger-core.js');
requireFile('miniprogram/assets/images/forest-header.png');
requireFile('miniprogram/assets/images/forest-guardian.png');
requireFile('miniprogram/assets/images/ledger-success.png');
for (const name of ['home', 'ledger', 'charts', 'details', 'mine']) {
  requirePng(`miniprogram/assets/tabbar/${name}-default.png`, { width: 81, height: 81, alpha: true });
  requirePng(`miniprogram/assets/tabbar/${name}-selected.png`, { width: 81, height: 81, alpha: true });
}
requireFile('cloudfunctions/initUser/index.js');
requireFile('cloudfunctions/ledgerQuery/index.js');
requireFile('cloudfunctions/ledgerWrite/index.js');
requireFile('cloudfunctions/ledgerWrite/ledger-write-core.js');
requireFile('docs/cloud-deployment.md');

const projectConfig = readJson('project.config.json');
const appConfig = readJson('miniprogram/app.json');

if (projectConfig.miniprogramRoot !== 'miniprogram/') {
  fail('project.config.json 的 miniprogramRoot 必须是 miniprogram/');
}

if (projectConfig.cloudfunctionRoot !== 'cloudfunctions/') {
  fail('project.config.json 的 cloudfunctionRoot 必须是 cloudfunctions/');
}

for (const page of appConfig.pages) {
  requireFile(`miniprogram/${page}.js`);
  requireFile(`miniprogram/${page}.json`);
  requireFile(`miniprogram/${page}.wxml`);
  requireFile(`miniprogram/${page}.wxss`);
}

for (const item of appConfig.tabBar.list) {
  if (!item.iconPath || !item.selectedIconPath) {
    fail(`tabBar 缺少图标配置: ${item.pagePath}`);
    continue;
  }

  requireFile(`miniprogram/${item.iconPath}`);
  requireFile(`miniprogram/${item.selectedIconPath}`);
}

for (const jsFile of walkFiles('miniprogram', (file) => file.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', path.join(root, jsFile)]);
}

for (const jsFile of walkFiles('cloudfunctions', (file) => file.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', path.join(root, jsFile)]);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('项目结构校验通过');

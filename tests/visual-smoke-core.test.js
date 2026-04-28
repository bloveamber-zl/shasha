const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const {
  buildVisualPages,
  buildCliAutoArgs,
  getLaunchTimeoutMs,
  getCliCandidates,
  resolveCliPath,
  toScreenshotName
} = require('../scripts/visual-smoke-core');

test('buildVisualPages maps app pages to visual smoke targets', () => {
  const pages = buildVisualPages({
    pages: [
      'pages/home/home',
      'pages/ledger/ledger',
      'pages/charts/charts'
    ]
  });

  assert.deepEqual(pages, [
    { name: 'home', path: '/pages/home/home' },
    { name: 'ledger', path: '/pages/ledger/ledger' },
    { name: 'charts', path: '/pages/charts/charts' }
  ]);
});

test('buildCliAutoArgs uses current WeChat DevTools auto port argument', () => {
  assert.deepEqual(buildCliAutoArgs('/repo/app', 9420), [
    'auto',
    '--project',
    '/repo/app',
    '--port',
    '9420',
    '--trust-project'
  ]);
});

test('getLaunchTimeoutMs uses a safe default and supports env override', () => {
  assert.equal(getLaunchTimeoutMs({}), 60000);
  assert.equal(getLaunchTimeoutMs({ VISUAL_SMOKE_TIMEOUT_MS: '90000' }), 90000);
  assert.equal(getLaunchTimeoutMs({ VISUAL_SMOKE_TIMEOUT_MS: 'bad' }), 60000);
});

test('toScreenshotName creates stable screenshot filenames', () => {
  assert.equal(toScreenshotName('/pages/home/home'), 'pages-home-home.png');
  assert.equal(toScreenshotName('pages/details/details'), 'pages-details-details.png');
});

test('resolveCliPath prefers explicit environment path', () => {
  const cliPath = path.join('/Applications', 'wechatwebdevtools.app', 'Contents', 'MacOS', 'cli');
  const resolved = resolveCliPath({
    env: { WECHAT_DEVTOOLS_CLI: cliPath },
    existsSync: () => false
  });

  assert.equal(resolved, cliPath);
});

test('resolveCliPath falls back to known macOS candidates', () => {
  const candidates = getCliCandidates('darwin');
  const resolved = resolveCliPath({
    env: {},
    platform: 'darwin',
    existsSync: (candidate) => candidate === candidates[0]
  });

  assert.equal(resolved, candidates[0]);
});

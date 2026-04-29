const assert = require('node:assert/strict');
const test = require('node:test');

const {
  findForbiddenSecretMarkers,
  validateFeatureWorkflow
} = require('../scripts/validation-core');

test('findForbiddenSecretMarkers flags sensitive runtime config markers', () => {
  const findings = findForbiddenSecretMarkers([
    { file: 'cloudfunctions/pay/index.js', content: 'const appSecret = "do-not-commit";' },
    { file: 'cloudfunctions/initUser/node_modules/pkg/index.js', content: 'const private_key = "sdk-test";' },
    { file: 'docs/cloud.md', content: '文档里可以提醒不要提交 AppSecret。' },
    { file: 'miniprogram/app.js', content: 'const traceUser = true;' }
  ]);

  assert.deepEqual(findings, [
    {
      file: 'cloudfunctions/pay/index.js',
      marker: 'appSecret'
    }
  ]);
});

test('validateFeatureWorkflow allows one active feature and closed status', () => {
  const featureList = {
    status_legend: {
      not_started: '',
      in_progress: '',
      blocked: '',
      passing: '',
      closed: ''
    },
    features: [
      { id: 'a', status: 'closed' },
      { id: 'b', status: 'in_progress' },
      { id: 'c', status: 'passing', evidence: ['ok'] }
    ]
  };

  assert.deepEqual(validateFeatureWorkflow(featureList), []);
});

test('validateFeatureWorkflow rejects duplicate active features and unevidenced passing', () => {
  const featureList = {
    status_legend: {
      not_started: '',
      in_progress: '',
      blocked: '',
      passing: ''
    },
    features: [
      { id: 'a', status: 'in_progress' },
      { id: 'b', status: 'in_progress' },
      { id: 'c', status: 'passing', evidence: [] }
    ]
  };

  const errors = validateFeatureWorkflow(featureList);
  assert(errors.includes('同一时间最多只能有一个 in_progress 功能'));
  assert(errors.includes('passing 功能缺少验证证据: c'));
});

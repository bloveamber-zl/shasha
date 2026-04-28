const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCloudRecordPayload,
  normalizeCloudRecord,
  normalizeCloudRecords,
  resolveCloudStatus
} = require('../miniprogram/utils/cloud-ledger-core');

test('buildCloudRecordPayload strips local display fields before cloud write', () => {
  const payload = buildCloudRecordPayload({
    id: 'local_1',
    _id: 'cloud_1',
    amountCents: 2860,
    signedAmountCents: -2860,
    displayAmount: '-28.60',
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '便当',
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z'
  });

  assert.deepEqual(payload, {
    amountCents: 2860,
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '便当'
  });
});

test('normalizeCloudRecord maps cloud _id into local id and computed display fields', () => {
  const record = normalizeCloudRecord({
    _id: 'cloud_1',
    amountCents: 520000,
    type: 'income',
    category: '工资',
    account: '银行卡',
    date: '2026-04-28',
    tags: ['固定'],
    note: '四月工资',
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z'
  });

  assert.equal(record.id, 'cloud_1');
  assert.equal(record.signedAmountCents, 520000);
  assert.equal(record.displayAmount, '+5200.00');
  assert.equal(record.note, '四月工资');
});

test('normalizeCloudRecords sorts records by date then created time descending', () => {
  const records = normalizeCloudRecords([
    { _id: 'a', amountCents: 100, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-27', createdAt: '2026-04-27T09:00:00.000Z' },
    { _id: 'b', amountCents: 100, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-28', createdAt: '2026-04-28T08:00:00.000Z' },
    { _id: 'c', amountCents: 100, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-28', createdAt: '2026-04-28T10:00:00.000Z' }
  ]);

  assert.deepEqual(records.map((record) => record.id), ['c', 'b', 'a']);
});

test('resolveCloudStatus keeps local mode when cloud is unavailable', () => {
  assert.deepEqual(resolveCloudStatus({ cloudReady: false }), {
    mode: 'local',
    label: '本地预览模式',
    error: ''
  });

  assert.deepEqual(resolveCloudStatus({ cloudReady: true, error: 'boom' }), {
    mode: 'fallback',
    label: '云同步失败，已使用本地数据',
    error: 'boom'
  });

  assert.deepEqual(resolveCloudStatus({ cloudReady: true }), {
    mode: 'synced',
    label: '云开发已就绪',
    error: ''
  });
});

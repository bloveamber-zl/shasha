const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCreateData,
  buildUpdateData,
  canAccessRecord,
  validateRecord
} = require('../cloudfunctions/ledgerWrite/ledger-write-core');

test('validateRecord rejects invalid cloud ledger input', () => {
  assert.equal(validateRecord(null), 'INVALID_RECORD');
  assert.equal(validateRecord({ type: 'bad' }), 'INVALID_TYPE');
  assert.equal(validateRecord({ type: 'expense', amountCents: 0 }), 'INVALID_AMOUNT');
  assert.equal(validateRecord({ type: 'expense', amountCents: 1 }), 'MISSING_CATEGORY');
  assert.equal(validateRecord({ type: 'expense', amountCents: 1, category: '餐饮' }), 'MISSING_ACCOUNT');
  assert.equal(validateRecord({ type: 'expense', amountCents: 1, category: '餐饮', account: '微信', date: 'bad' }), 'INVALID_DATE');
});

test('buildCreateData adds ownership and timestamps', () => {
  const now = new Date('2026-04-28T00:00:00.000Z');
  const data = buildCreateData({
    amountCents: 2860,
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '便当'
  }, 'openid_1', now);

  assert.deepEqual(data, {
    openid: 'openid_1',
    amountCents: 2860,
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '便当',
    createdAt: now,
    updatedAt: now
  });
});
test('canAccessRecord only allows owner openid', () => {
  assert.equal(canAccessRecord({ openid: 'a' }, 'a'), true);
  assert.equal(canAccessRecord({ openid: 'a' }, 'b'), false);
  assert.equal(canAccessRecord(null, 'a'), false);
});

test('buildUpdateData strips ownership fields and only updates editable fields', () => {
  const now = new Date('2026-04-28T01:00:00.000Z');
  const data = buildUpdateData({
    _id: 'cloud_1',
    openid: 'attacker',
    amountCents: 3000,
    type: 'expense',
    category: '交通',
    account: '支付宝',
    date: '2026-04-29',
    tags: ['通勤'],
    note: '地铁',
    createdAt: 'bad'
  }, now);

  assert.deepEqual(data, {
    amountCents: 3000,
    type: 'expense',
    category: '交通',
    account: '支付宝',
    date: '2026-04-29',
    tags: ['通勤'],
    note: '地铁',
    updatedAt: now
  });
});

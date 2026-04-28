const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseYuanToCents,
  formatCurrencyCents,
  createLedgerRecord,
  summarizeRecords,
  filterRecords,
  groupRecordsByDate
} = require('../miniprogram/utils/ledger');

test('parseYuanToCents converts decimal yuan input into cents', () => {
  assert.equal(parseYuanToCents('28.60'), 2860);
  assert.equal(parseYuanToCents(' 8 '), 800);
  assert.equal(parseYuanToCents('0.05'), 5);
});

test('formatCurrencyCents formats signed cent amounts', () => {
  assert.equal(formatCurrencyCents(123456), '1234.56');
  assert.equal(formatCurrencyCents(-805), '-8.05');
  assert.equal(formatCurrencyCents(0), '0.00');
});

test('createLedgerRecord normalizes expense and income records', () => {
  const expense = createLedgerRecord({
    amountCents: 1280,
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '便当'
  });

  const income = createLedgerRecord({
    amountCents: 500000,
    type: 'income',
    category: '工资',
    account: '银行卡',
    date: '2026-04-28'
  });

  assert.equal(expense.signedAmountCents, -1280);
  assert.equal(expense.displayAmount, '-12.80');
  assert.equal(income.signedAmountCents, 500000);
  assert.equal(income.displayAmount, '+5000.00');
  assert.match(expense.id, /^ledger_/);
});

test('summarizeRecords returns income expense balance and daily average', () => {
  const records = [
    createLedgerRecord({ amountCents: 500000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 1680, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 9900, type: 'expense', category: '购物', account: '支付宝', date: '2026-04-02' })
  ];

  const summary = summarizeRecords(records);

  assert.deepEqual(summary, {
    incomeCents: 500000,
    expenseCents: 11580,
    balanceCents: 488420,
    dailyExpenseAverageCents: 5790,
    recordCount: 3
  });
});

test('filterRecords filters by type category account tag and date range', () => {
  const records = [
    createLedgerRecord({ amountCents: 1800, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01', tags: ['早餐'] }),
    createLedgerRecord({ amountCents: 3000, type: 'expense', category: '交通', account: '支付宝', date: '2026-04-10', tags: ['通勤'] }),
    createLedgerRecord({ amountCents: 600000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-15', tags: ['固定'] })
  ];

  const filtered = filterRecords(records, {
    type: 'expense',
    category: '交通',
    account: '支付宝',
    tag: '通勤',
    startDate: '2026-04-05',
    endDate: '2026-04-30'
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].category, '交通');
});

test('groupRecordsByDate sorts date groups descending', () => {
  const records = [
    createLedgerRecord({ amountCents: 1800, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 3000, type: 'expense', category: '交通', account: '支付宝', date: '2026-04-02' }),
    createLedgerRecord({ amountCents: 600000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-01' })
  ];

  const groups = groupRecordsByDate(records);

  assert.equal(groups[0].date, '2026-04-02');
  assert.equal(groups[0].records.length, 1);
  assert.equal(groups[1].date, '2026-04-01');
  assert.equal(groups[1].records.length, 2);
});

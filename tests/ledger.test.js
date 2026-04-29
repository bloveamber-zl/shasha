const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseYuanToCents,
  formatCurrencyCents,
  createLedgerRecord,
  summarizeRecords,
  filterRecords,
  groupRecordsByDate,
  sortRecords,
  upsertRecord,
  deleteRecordById,
  parseTagText,
  getDateOffset,
  buildCategoryBreakdown,
  buildTrendBuckets,
  buildInsightSummary
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

test('sortRecords upsertRecord and deleteRecordById manage local ledger collections', () => {
  const oldRecord = createLedgerRecord({ id: 'old', amountCents: 100, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01', createdAt: '2026-04-01T08:00:00.000Z' });
  const editedRecord = createLedgerRecord({ id: 'old', amountCents: 200, type: 'expense', category: '交通', account: '微信', date: '2026-04-03', createdAt: '2026-04-01T08:00:00.000Z' });
  const newRecord = createLedgerRecord({ id: 'new', amountCents: 300, type: 'income', category: '红包', account: '微信', date: '2026-04-02', createdAt: '2026-04-02T08:00:00.000Z' });

  const records = upsertRecord([oldRecord], newRecord);
  const updated = upsertRecord(records, editedRecord);

  assert.deepEqual(sortRecords(updated).map((record) => record.id), ['old', 'new']);
  assert.equal(updated.find((record) => record.id === 'old').category, '交通');
  assert.deepEqual(deleteRecordById(updated, 'old').map((record) => record.id), ['new']);
});

test('parseTagText and getDateOffset support ledger form entry', () => {
  assert.deepEqual(parseTagText('午餐，通勤, 周末  午餐'), ['午餐', '通勤', '周末']);
  assert.equal(getDateOffset('2026-04-29', -1), '2026-04-28');
  assert.equal(getDateOffset('2026-01-01', -1), '2025-12-31');
});

test('buildCategoryBreakdown supports expense and income percentages', () => {
  const categories = [
    { name: '餐饮', icon: '🍚', color: '#E9825E' },
    { name: '工资', icon: '🌰', color: '#4FA6A0' }
  ];
  const records = [
    createLedgerRecord({ amountCents: 300, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 700, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-02' }),
    createLedgerRecord({ amountCents: 5000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-03' })
  ];

  const expense = buildCategoryBreakdown(records, categories, 'expense');
  const income = buildCategoryBreakdown(records, categories, 'income');

  assert.equal(expense.totalCents, 1000);
  assert.equal(expense.items[0].percent, 100);
  assert.equal(income.totalCents, 5000);
  assert.equal(income.items[0].category, '工资');
});

test('buildTrendBuckets builds daily weekly and monthly trend buckets', () => {
  const records = [
    createLedgerRecord({ amountCents: 100, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 200, type: 'expense', category: '交通', account: '微信', date: '2026-04-03' }),
    createLedgerRecord({ amountCents: 500, type: 'income', category: '工资', account: '银行卡', date: '2026-05-02' })
  ];

  const daily = buildTrendBuckets(records, 'day');
  const weekly = buildTrendBuckets(records, 'week');
  const monthly = buildTrendBuckets(records, 'month');

  assert.deepEqual(daily.map((item) => item.key), ['2026-04-01', '2026-04-03', '2026-05-02']);
  assert.equal(weekly.length, 2);
  assert.deepEqual(monthly.map((item) => item.key), ['2026-04', '2026-05']);
  assert.equal(monthly[0].expenseCents, 300);
  assert.equal(monthly[1].incomeCents, 500);
});

test('buildInsightSummary returns multidimensional summary fields', () => {
  const records = [
    createLedgerRecord({ amountCents: 1000, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 5000, type: 'expense', category: '购物', account: '银行卡', date: '2026-04-02' }),
    createLedgerRecord({ amountCents: 8000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-03' })
  ];

  const summary = buildInsightSummary(records);

  assert.equal(summary.balanceCents, 2000);
  assert.equal(summary.topExpenseCategory, '购物');
  assert.equal(summary.topExpenseCategoryCents, 5000);
  assert.equal(summary.dailyExpenseAverageCents, 3000);
});

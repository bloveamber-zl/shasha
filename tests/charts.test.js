const assert = require('node:assert/strict');
const test = require('node:test');

const { createLedgerRecord } = require('../miniprogram/utils/ledger');
const { buildChartsViewModel } = require('../miniprogram/utils/charts');

const categories = [
  { name: '餐饮', icon: '🍚', color: '#E9825E', type: 'expense' },
  { name: '交通', icon: '🚌', color: '#5C9ED8', type: 'expense' },
  { name: '工资', icon: '🌰', color: '#4FA6A0', type: 'income' }
];

test('buildChartsViewModel builds day week month trend and expense breakdown', () => {
  const records = [
    createLedgerRecord({ amountCents: 1000, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 2000, type: 'expense', category: '交通', account: '微信', date: '2026-04-08' }),
    createLedgerRecord({ amountCents: 8000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-09' }),
    createLedgerRecord({ amountCents: 3000, type: 'expense', category: '餐饮', account: '微信', date: '2026-05-01' })
  ];

  const day = buildChartsViewModel(records, categories, { trendMode: 'day', breakdownType: 'expense' });
  const week = buildChartsViewModel(records, categories, { trendMode: 'week', breakdownType: 'expense' });
  const month = buildChartsViewModel(records, categories, { trendMode: 'month', breakdownType: 'income' });

  assert.deepEqual(day.trend.map((item) => item.key), ['2026-04-01', '2026-04-08', '2026-04-09', '2026-05-01']);
  assert.equal(week.trend.length, 3);
  assert.deepEqual(month.trend.map((item) => item.key), ['2026-04', '2026-05']);
  assert.equal(day.breakdown.items[0].category, '餐饮');
  assert.equal(month.breakdown.items[0].category, '工资');
  assert.equal(day.hasRecords, true);
  assert.equal(day.isSingleRecord, false);
});

test('buildChartsViewModel marks empty and single-record states', () => {
  const empty = buildChartsViewModel([], categories, {});
  const single = buildChartsViewModel([
    createLedgerRecord({ amountCents: 1280, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-29' })
  ], categories, {});

  assert.equal(empty.hasRecords, false);
  assert.equal(empty.emptyTitle, '还没有可观察的账单');
  assert.deepEqual(empty.trend, []);
  assert.equal(single.hasRecords, true);
  assert.equal(single.isSingleRecord, true);
  assert.equal(single.stateHint, '当前只有 1 笔记录，趋势会随更多账单变得稳定。');
  assert.equal(single.trend[0].height, 150);
});

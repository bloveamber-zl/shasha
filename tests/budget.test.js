const assert = require('node:assert/strict');
const test = require('node:test');

const { createLedgerRecord } = require('../miniprogram/utils/ledger');
const { buildBudgetViewModel } = require('../miniprogram/utils/budget');

const categories = [
  { name: '餐饮', icon: '🍚', color: '#E9825E', type: 'expense' },
  { name: '交通', icon: '🚌', color: '#5C9ED8', type: 'expense' },
  { name: '购物', icon: '🧺', color: '#D59B45', type: 'expense' }
];

test('buildBudgetViewModel calculates monthly budget progress and daily available amount', () => {
  const records = [
    createLedgerRecord({ amountCents: 120000, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01' }),
    createLedgerRecord({ amountCents: 80000, type: 'expense', category: '交通', account: '微信', date: '2026-04-10' }),
    createLedgerRecord({ amountCents: 99900, type: 'expense', category: '购物', account: '微信', date: '2026-03-30' }),
    createLedgerRecord({ amountCents: 500000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-08' })
  ];
  const budgets = [
    { id: 'month', type: 'month', amountCents: 500000 },
    { id: 'food', type: 'category', category: '餐饮', amountCents: 150000 }
  ];

  const viewModel = buildBudgetViewModel(records, budgets, categories, '2026-04', new Date('2026-04-10T00:00:00Z'));

  assert.equal(viewModel.month, '2026-04');
  assert.equal(viewModel.monthBudget.amount, '5000.00');
  assert.equal(viewModel.monthBudget.spent, '2000.00');
  assert.equal(viewModel.monthBudget.remaining, '3000.00');
  assert.equal(viewModel.monthBudget.headlineLabel, '还可用');
  assert.equal(viewModel.monthBudget.percent, 40);
  assert.equal(viewModel.monthBudget.dailyAvailable, '142.86');
  assert.equal(viewModel.categoryBudgets[0].category, '餐饮');
  assert.equal(viewModel.categoryBudgets[0].spent, '1200.00');
  assert.equal(viewModel.categoryBudgets[0].remaining, '300.00');
  assert.equal(viewModel.categoryBudgets[0].tone, 'warn');
});

test('buildBudgetViewModel marks overspent and missing-budget states', () => {
  const records = [
    createLedgerRecord({ amountCents: 260000, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-12' })
  ];
  const budgets = [
    { id: 'month', type: 'month', amountCents: 200000 },
    { id: 'food', type: 'category', category: '餐饮', amountCents: 180000 }
  ];

  const overspent = buildBudgetViewModel(records, budgets, categories, '2026-04', new Date('2026-04-12T00:00:00Z'));
  const empty = buildBudgetViewModel([], [], categories, '2026-04', new Date('2026-04-12T00:00:00Z'));

  assert.equal(overspent.monthBudget.remainingCents, -60000);
  assert.equal(overspent.monthBudget.headlineLabel, '已超支');
  assert.equal(overspent.monthBudget.overspent, '600.00');
  assert.equal(overspent.monthBudget.tone, 'danger');
  assert.equal(overspent.categoryBudgets[0].overspent, '800.00');
  assert.equal(overspent.categoryBudgets[0].tone, 'danger');
  assert.equal(empty.hasBudget, false);
  assert.equal(empty.monthBudget.statusText, '暂未设置月度预算');
});

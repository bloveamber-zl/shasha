const assert = require('node:assert/strict');
const test = require('node:test');

const { createLedgerRecord } = require('../miniprogram/utils/ledger');
const { buildCalendarViewModel, getMonthOffset } = require('../miniprogram/utils/calendar');

test('buildCalendarViewModel builds month grid with daily income expense and selected records', () => {
  const records = [
    createLedgerRecord({ amountCents: 1000, type: 'expense', category: '餐饮', account: '微信', date: '2026-04-01', note: '早餐' }),
    createLedgerRecord({ amountCents: 5000, type: 'income', category: '工资', account: '银行卡', date: '2026-04-01', note: '兼职' }),
    createLedgerRecord({ amountCents: 2300, type: 'expense', category: '交通', account: '支付宝', date: '2026-04-15' }),
    createLedgerRecord({ amountCents: 9999, type: 'expense', category: '购物', account: '微信', date: '2026-05-01' })
  ];

  const viewModel = buildCalendarViewModel(records, '2026-04', '2026-04-01');
  const firstDay = viewModel.weeks[0].days.find((day) => day.date === '2026-04-01');

  assert.equal(viewModel.month, '2026-04');
  assert.equal(viewModel.monthLabel, '2026年4月');
  assert.equal(viewModel.monthSummary.expense, '33.00');
  assert.equal(viewModel.monthSummary.income, '50.00');
  assert.equal(viewModel.monthSummary.balance, '17.00');
  assert.equal(firstDay.expense, '10.00');
  assert.equal(firstDay.income, '50.00');
  assert.equal(firstDay.hasRecords, true);
  assert.equal(firstDay.isSelected, true);
  assert.equal(viewModel.selectedDay.records.length, 2);
  assert.equal(viewModel.selectedDay.summary.expense, '10.00');
});

test('buildCalendarViewModel keeps stable leading and trailing days', () => {
  const viewModel = buildCalendarViewModel([], '2026-02', '2026-02-10');
  const flatDays = viewModel.weeks.flatMap((week) => week.days);

  assert.equal(viewModel.weeks.length, 5);
  assert.equal(flatDays[0].date, '2026-01-26');
  assert.equal(flatDays[0].inMonth, false);
  assert.equal(flatDays[6].date, '2026-02-01');
  assert.equal(flatDays[6].inMonth, true);
  assert.equal(flatDays.at(-1).date, '2026-03-01');
  assert.equal(viewModel.selectedDay.date, '2026-02-10');
  assert.equal(viewModel.selectedDay.records.length, 0);
});

test('getMonthOffset moves across year boundaries', () => {
  assert.equal(getMonthOffset('2026-01', -1), '2025-12');
  assert.equal(getMonthOffset('2026-12', 1), '2027-01');
});

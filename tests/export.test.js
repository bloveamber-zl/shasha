const assert = require('node:assert/strict');
const test = require('node:test');

const { createLedgerRecord } = require('../miniprogram/utils/ledger');
const {
  buildExportFileName,
  buildLedgerCsv,
  buildLedgerExportRows,
  buildLedgerExportViewModel
} = require('../miniprogram/utils/export');

test('buildLedgerExportRows filters by date range and exports only business fields', () => {
  const records = [
    createLedgerRecord({
      id: 'before',
      amountCents: 1000,
      type: 'expense',
      category: '餐饮',
      account: '微信',
      date: '2026-03-31',
      tags: ['早餐'],
      note: '区间外'
    }),
    {
      ...createLedgerRecord({
        id: 'salary',
        amountCents: 520000,
        type: 'income',
        category: '工资',
        account: '银行卡',
        date: '2026-04-28',
        tags: ['固定'],
        note: '四月工资'
      }),
      _openid: 'secret_openid',
      ownerOpenid: 'another_secret'
    },
    createLedgerRecord({
      id: 'lunch',
      amountCents: 2860,
      type: 'expense',
      category: '餐饮',
      account: '微信',
      date: '2026-04-29',
      tags: ['午餐', '通勤'],
      note: '森林便当'
    })
  ];

  const rows = buildLedgerExportRows(records, {
    startDate: '2026-04-01',
    endDate: '2026-04-30'
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(Object.keys(rows[0]), ['date', 'typeLabel', 'amountYuan', 'category', 'account', 'tags', 'note']);
  assert.deepEqual(rows.map((row) => row.date), ['2026-04-28', '2026-04-29']);
  assert.equal(rows[0].typeLabel, '收入');
  assert.equal(rows[0].amountYuan, '5200.00');
  assert.equal(rows[1].tags, '午餐 / 通勤');
});

test('buildLedgerCsv escapes cells and keeps Chinese content readable', () => {
  const records = [
    createLedgerRecord({
      id: 'quote',
      amountCents: 1288,
      type: 'expense',
      category: '餐饮',
      account: '微信',
      date: '2026-04-29',
      tags: ['午餐'],
      note: '米饭, 鸡蛋 "加量"'
    })
  ];

  const csv = buildLedgerCsv(records, {
    startDate: '2026-04-01',
    endDate: '2026-04-30'
  });

  assert.ok(csv.startsWith('\ufeff日期,收支类型,金额(元),分类,账户,标签,备注'));
  assert.ok(csv.includes('"米饭, 鸡蛋 ""加量"""'));
  assert.ok(!csv.includes('_openid'));
  assert.ok(!csv.includes('createdAt'));
});

test('buildLedgerExportViewModel returns summary and stable file name', () => {
  const records = [
    createLedgerRecord({
      amountCents: 520000,
      type: 'income',
      category: '工资',
      account: '银行卡',
      date: '2026-04-28'
    }),
    createLedgerRecord({
      amountCents: 2860,
      type: 'expense',
      category: '餐饮',
      account: '微信',
      date: '2026-04-29'
    })
  ];

  const viewModel = buildLedgerExportViewModel(records, {
    startDate: '2026-04-01',
    endDate: '2026-04-30'
  });

  assert.equal(viewModel.recordCount, 2);
  assert.equal(viewModel.income, '5200.00');
  assert.equal(viewModel.expense, '28.60');
  assert.equal(viewModel.balance, '5171.40');
  assert.equal(viewModel.fileName, 'shasha-ledger-20260401-20260430.csv');
  assert.equal(buildExportFileName({}), 'shasha-ledger-all.csv');
});

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildDueOccurrences,
  buildRecurringRecord,
  createRecurringRule,
  markOccurrenceConfirmed
} = require('../miniprogram/utils/recurring');

test('buildDueOccurrences returns only unconfirmed due monthly occurrences', () => {
  const rule = createRecurringRule({
    id: 'rent',
    name: '房租',
    type: 'expense',
    amountCents: 250000,
    category: '居住',
    account: '银行卡',
    tags: ['固定', '房租'],
    note: '每月房租',
    frequency: 'monthly',
    startDate: '2026-01-05',
    dayOfMonth: 5,
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  });

  const due = buildDueOccurrences(
    [rule],
    ['rent:2026-01', 'rent:2026-02', 'rent:2026-03'],
    '2026-04-29'
  );

  assert.equal(due.length, 1);
  assert.equal(due[0].key, 'rent:2026-04');
  assert.equal(due[0].dueDate, '2026-04-05');
  assert.equal(due[0].displayAmount, '-2500.00');
});

test('buildDueOccurrences clamps monthly due date to the last day of short months', () => {
  const rule = createRecurringRule({
    id: 'membership',
    name: '会员',
    type: 'expense',
    amountCents: 990,
    category: '娱乐',
    account: '微信',
    frequency: 'monthly',
    startDate: '2026-02-01',
    dayOfMonth: 31
  });

  const due = buildDueOccurrences([rule], [], '2026-02-28');

  assert.equal(due.length, 1);
  assert.equal(due[0].key, 'membership:2026-02');
  assert.equal(due[0].dueDate, '2026-02-28');
});

test('weekly and custom rules generate stable occurrence keys', () => {
  const weeklyRule = createRecurringRule({
    id: 'salary',
    name: '工资',
    type: 'income',
    amountCents: 800000,
    category: '工资',
    account: '银行卡',
    frequency: 'weekly',
    startDate: '2026-04-01'
  });
  const customRule = createRecurringRule({
    id: 'coffee',
    name: '咖啡豆',
    type: 'expense',
    amountCents: 6800,
    category: '餐饮',
    account: '微信',
    frequency: 'custom',
    intervalDays: 10,
    startDate: '2026-04-01'
  });

  const due = buildDueOccurrences([weeklyRule, customRule], [], '2026-04-21');

  assert.deepEqual(
    due.map((item) => item.key),
    [
      'coffee:2026-04-01',
      'salary:2026-04-01',
      'salary:2026-04-08',
      'coffee:2026-04-11',
      'salary:2026-04-15',
      'coffee:2026-04-21'
    ]
  );
});

test('buildRecurringRecord creates a deterministic ledger record and confirmed keys stay unique', () => {
  const rule = createRecurringRule({
    id: 'rent',
    name: '房租',
    type: 'expense',
    amountCents: 250000,
    category: '居住',
    account: '银行卡',
    tags: ['固定'],
    note: '每月房租',
    frequency: 'monthly',
    startDate: '2026-04-01',
    dayOfMonth: 5
  });
  const [occurrence] = buildDueOccurrences([rule], [], '2026-04-29');

  const record = buildRecurringRecord(rule, occurrence, '2026-04-29T08:00:00.000Z');
  const confirmed = markOccurrenceConfirmed(['rent:2026-04'], 'rent:2026-04');

  assert.equal(record.id, 'recurring_rent_2026_04');
  assert.equal(record.date, '2026-04-05');
  assert.equal(record.type, 'expense');
  assert.equal(record.displayAmount, '-2500.00');
  assert.deepEqual(record.tags, ['固定']);
  assert.equal(record.note, '每月房租');
  assert.deepEqual(confirmed, ['rent:2026-04']);
});

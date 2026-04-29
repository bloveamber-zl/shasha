const assert = require('node:assert/strict');
const test = require('node:test');

const {
  addAccount,
  addCategory,
  addTag,
  buildTagOptions
} = require('../miniprogram/utils/manage');

test('addCategory adds sanitized category and avoids duplicate names in same type', () => {
  const categories = [
    { id: 'food', name: '餐饮', icon: '🍚', color: '#E9825E', type: 'expense' },
    { id: 'salary', name: '工资', icon: '🌰', color: '#4FA6A0', type: 'income' }
  ];

  const added = addCategory(categories, {
    name: '  咖啡 ',
    type: 'expense',
    icon: '',
    color: ''
  });
  const duplicate = addCategory(added, {
    name: '咖啡',
    type: 'expense'
  });
  const incomeSameName = addCategory(duplicate, {
    name: '咖啡',
    type: 'income',
    icon: '☕',
    color: '#8B6F47'
  });

  assert.equal(added.at(-1).name, '咖啡');
  assert.equal(added.at(-1).icon, '🌿');
  assert.equal(added.at(-1).color, '#79A86D');
  assert.equal(duplicate.length, added.length);
  assert.equal(incomeSameName.length, added.length + 1);
});

test('addAccount and addTag keep ordered unique values', () => {
  assert.deepEqual(addAccount(['微信'], ' 现金 '), ['微信', '现金']);
  assert.deepEqual(addAccount(['微信'], '微信'), ['微信']);
  assert.deepEqual(addTag(['午餐'], ' 通勤 '), ['午餐', '通勤']);
  assert.deepEqual(addTag(['午餐'], '午餐'), ['午餐']);
});

test('buildTagOptions combines configured and record tags', () => {
  const records = [
    { tags: ['午餐', '通勤'] },
    { tags: ['通勤', '周末'] }
  ];

  assert.deepEqual(buildTagOptions(['固定', '午餐'], records), ['固定', '午餐', '通勤', '周末']);
});

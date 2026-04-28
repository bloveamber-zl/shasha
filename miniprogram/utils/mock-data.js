const { createLedgerRecord } = require('./ledger');

const categories = [
  { id: 'food', name: '餐饮', icon: '🍚', color: '#E9825E', type: 'expense' },
  { id: 'traffic', name: '交通', icon: '🚌', color: '#5C9ED8', type: 'expense' },
  { id: 'shopping', name: '购物', icon: '🧺', color: '#D59B45', type: 'expense' },
  { id: 'home', name: '住房', icon: '🏡', color: '#8F7AC8', type: 'expense' },
  { id: 'fun', name: '娱乐', icon: '✨', color: '#D87BA7', type: 'expense' },
  { id: 'health', name: '医疗', icon: '🌿', color: '#78A85F', type: 'expense' },
  { id: 'salary', name: '工资', icon: '🌰', color: '#4FA6A0', type: 'income' },
  { id: 'bonus', name: '红包', icon: '🧧', color: '#D96D56', type: 'income' }
];

const accounts = ['微信', '支付宝', '银行卡', '现金'];

const sampleRecords = [
  createLedgerRecord({
    id: 'ledger_demo_001',
    amountCents: 520000,
    type: 'income',
    category: '工资',
    account: '银行卡',
    date: '2026-04-28',
    tags: ['固定'],
    note: '四月工资'
  }),
  createLedgerRecord({
    id: 'ledger_demo_002',
    amountCents: 2860,
    type: 'expense',
    category: '餐饮',
    account: '微信',
    date: '2026-04-28',
    tags: ['午餐'],
    note: '森林便当'
  }),
  createLedgerRecord({
    id: 'ledger_demo_003',
    amountCents: 1360,
    type: 'expense',
    category: '交通',
    account: '支付宝',
    date: '2026-04-27',
    tags: ['通勤'],
    note: '地铁'
  }),
  createLedgerRecord({
    id: 'ledger_demo_004',
    amountCents: 19900,
    type: 'expense',
    category: '购物',
    account: '银行卡',
    date: '2026-04-25',
    tags: ['日用'],
    note: '收纳用品'
  }),
  createLedgerRecord({
    id: 'ledger_demo_005',
    amountCents: 6600,
    type: 'expense',
    category: '娱乐',
    account: '微信',
    date: '2026-04-23',
    tags: ['周末'],
    note: '电影'
  }),
  createLedgerRecord({
    id: 'ledger_demo_006',
    amountCents: 88000,
    type: 'income',
    category: '红包',
    account: '微信',
    date: '2026-04-20',
    tags: ['礼物'],
    note: '生日红包'
  })
];

module.exports = {
  categories,
  accounts,
  sampleRecords
};


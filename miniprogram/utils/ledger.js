function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseYuanToCents(value) {
  const normalized = String(value || '0').trim();
  const [yuanPart, centPart = ''] = normalized.split('.');
  const yuan = Number(yuanPart || 0);
  const cents = Number(centPart.padEnd(2, '0').slice(0, 2) || 0);
  return Math.round(yuan * 100 + cents);
}

function formatCurrencyCents(amountCents) {
  const sign = amountCents < 0 ? '-' : '';
  const absolute = Math.abs(Number(amountCents) || 0);
  const yuan = Math.floor(absolute / 100);
  const cents = absolute % 100;
  return `${sign}${yuan}.${pad2(cents)}`;
}

function assertLedgerType(type) {
  if (type !== 'income' && type !== 'expense') {
    throw new Error(`不支持的账单类型: ${type}`);
  }
}

function createLedgerRecord(input) {
  assertLedgerType(input.type);

  const amountCents = Math.abs(Math.round(Number(input.amountCents) || 0));
  const signedAmountCents = input.type === 'income' ? amountCents : -amountCents;
  const sign = input.type === 'income' ? '+' : '-';

  return {
    id: input.id || `ledger_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    amountCents,
    signedAmountCents,
    displayAmount: `${sign}${formatCurrencyCents(amountCents)}`,
    type: input.type,
    category: input.category,
    account: input.account,
    date: input.date,
    tags: Array.isArray(input.tags) ? input.tags : [],
    note: input.note || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString()
  };
}

function summarizeRecords(records) {
  const summary = records.reduce(
    (acc, record) => {
      if (record.type === 'income') {
        acc.incomeCents += record.amountCents;
      } else if (record.type === 'expense') {
        acc.expenseCents += record.amountCents;
        acc.expenseDates.add(record.date);
      }
      return acc;
    },
    {
      incomeCents: 0,
      expenseCents: 0,
      expenseDates: new Set()
    }
  );

  const expenseDayCount = summary.expenseDates.size || 1;

  return {
    incomeCents: summary.incomeCents,
    expenseCents: summary.expenseCents,
    balanceCents: summary.incomeCents - summary.expenseCents,
    dailyExpenseAverageCents: Math.round(summary.expenseCents / expenseDayCount),
    recordCount: records.length
  };
}

function filterRecords(records, filters) {
  return records.filter((record) => {
    if (filters.type && record.type !== filters.type) return false;
    if (filters.category && record.category !== filters.category) return false;
    if (filters.account && record.account !== filters.account) return false;
    if (filters.tag && !record.tags.includes(filters.tag)) return false;
    if (filters.startDate && record.date < filters.startDate) return false;
    if (filters.endDate && record.date > filters.endDate) return false;
    return true;
  });
}

function groupRecordsByDate(records) {
  const groupMap = records.reduce((acc, record) => {
    if (!acc.has(record.date)) {
      acc.set(record.date, []);
    }
    acc.get(record.date).push(record);
    return acc;
  }, new Map());

  return Array.from(groupMap.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, dateRecords]) => ({
      date,
      records: dateRecords
    }));
}

module.exports = {
  parseYuanToCents,
  formatCurrencyCents,
  createLedgerRecord,
  summarizeRecords,
  filterRecords,
  groupRecordsByDate
};

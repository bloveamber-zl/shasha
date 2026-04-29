function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function getTodayDate(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function getDateOffset(baseDate, offsetDays) {
  const date = toDate(baseDate);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatDate(date);
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

function sortRecords(records) {
  return (records || []).slice().sort((a, b) => {
    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function upsertRecord(records, nextRecord) {
  const found = (records || []).some((record) => record.id === nextRecord.id);
  const nextRecords = found
    ? records.map((record) => (record.id === nextRecord.id ? nextRecord : record))
    : [nextRecord].concat(records || []);
  return sortRecords(nextRecords);
}

function deleteRecordById(records, id) {
  return (records || []).filter((record) => record.id !== id);
}

function parseTagText(value) {
  const seen = new Set();
  return String(value || '')
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
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

function createCategoryMeta(categories) {
  return (categories || []).reduce((map, item) => {
    map[item.name] = item;
    return map;
  }, {});
}

function buildCategoryBreakdown(records, categories, type = 'expense', limit = 8) {
  const meta = createCategoryMeta(categories);
  const typedRecords = (records || []).filter((record) => record.type === type);
  const grouped = typedRecords.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + record.amountCents;
    return map;
  }, {});
  const totalCents = typedRecords.reduce((sum, record) => sum + record.amountCents, 0);

  const items = Object.keys(grouped)
    .map((category) => {
      const item = meta[category] || {};
      return {
        category,
        icon: item.icon || '🌿',
        color: item.color || '#79A86D',
        amountCents: grouped[category],
        amount: formatCurrencyCents(grouped[category]),
        percent: totalCents > 0 ? Math.round((grouped[category] / totalCents) * 100) : 0
      };
    })
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, limit);

  return {
    type,
    totalCents,
    total: formatCurrencyCents(totalCents),
    items
  };
}

function getWeekStart(dateText) {
  const date = toDate(dateText);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return formatDate(date);
}

function getBucketInfo(dateText, mode) {
  if (mode === 'month') {
    const key = dateText.slice(0, 7);
    return {
      key,
      label: `${Number(key.slice(5, 7))}月`
    };
  }

  if (mode === 'week') {
    const key = getWeekStart(dateText);
    return {
      key,
      label: `${key.slice(5).replace('-', '/')}周`
    };
  }

  return {
    key: dateText,
    label: dateText.slice(5)
  };
}

function buildTrendBuckets(records, mode = 'day', limit = 7) {
  const bucketMap = (records || []).reduce((map, record) => {
    const bucket = getBucketInfo(record.date, mode);
    if (!map[bucket.key]) {
      map[bucket.key] = {
        key: bucket.key,
        label: bucket.label,
        incomeCents: 0,
        expenseCents: 0,
        balanceCents: 0,
        count: 0
      };
    }

    if (record.type === 'income') {
      map[bucket.key].incomeCents += record.amountCents;
    } else if (record.type === 'expense') {
      map[bucket.key].expenseCents += record.amountCents;
    }
    map[bucket.key].balanceCents = map[bucket.key].incomeCents - map[bucket.key].expenseCents;
    map[bucket.key].count += 1;
    return map;
  }, {});

  const buckets = Object.values(bucketMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-limit);
  const maxExpense = Math.max(1, ...buckets.map((bucket) => bucket.expenseCents));

  return buckets.map((bucket) => ({
    ...bucket,
    income: formatCurrencyCents(bucket.incomeCents),
    expense: formatCurrencyCents(bucket.expenseCents),
    balance: formatCurrencyCents(bucket.balanceCents),
    height: bucket.expenseCents > 0 ? Math.max(16, Math.round((bucket.expenseCents / maxExpense) * 150)) : 16
  }));
}

function buildInsightSummary(records) {
  const summary = summarizeRecords(records || []);
  const breakdown = buildCategoryBreakdown(records || [], [], 'expense', 1);
  const top = breakdown.items[0] || {
    category: '暂无',
    amountCents: 0
  };

  return {
    ...summary,
    topExpenseCategory: top.category,
    topExpenseCategoryCents: top.amountCents
  };
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
  getTodayDate,
  getDateOffset,
  parseYuanToCents,
  formatCurrencyCents,
  createLedgerRecord,
  sortRecords,
  upsertRecord,
  deleteRecordById,
  parseTagText,
  summarizeRecords,
  filterRecords,
  groupRecordsByDate,
  buildCategoryBreakdown,
  buildTrendBuckets,
  buildInsightSummary
};

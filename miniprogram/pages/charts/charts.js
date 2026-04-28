const { summarizeRecords, groupRecordsByDate, formatCurrencyCents } = require('../../utils/ledger');
const { formatSummary } = require('../../utils/format');

function buildCategoryStats(records, categories) {
  const expenseRecords = records.filter((record) => record.type === 'expense');
  const total = expenseRecords.reduce((sum, record) => sum + record.amountCents, 0) || 1;
  const colorMap = categories.reduce((map, item) => {
    map[item.name] = item.color;
    return map;
  }, {});
  const iconMap = categories.reduce((map, item) => {
    map[item.name] = item.icon;
    return map;
  }, {});
  const grouped = expenseRecords.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + record.amountCents;
    return map;
  }, {});

  return Object.keys(grouped)
    .map((category) => ({
      category,
      icon: iconMap[category] || '🌿',
      color: colorMap[category] || '#79A86D',
      amount: formatCurrencyCents(grouped[category]),
      percent: Math.round((grouped[category] / total) * 100)
    }))
    .sort((a, b) => b.percent - a.percent);
}

function buildTrend(records) {
  const groups = groupRecordsByDate(records).slice(0, 5).reverse();
  const maxExpense = Math.max(
    1,
    ...groups.map((group) =>
      group.records
        .filter((record) => record.type === 'expense')
        .reduce((sum, record) => sum + record.amountCents, 0)
    )
  );

  return groups.map((group) => {
    const expense = group.records
      .filter((record) => record.type === 'expense')
      .reduce((sum, record) => sum + record.amountCents, 0);
    return {
      date: group.date.slice(5),
      expense: formatCurrencyCents(expense),
      height: Math.max(16, Math.round((expense / maxExpense) * 150))
    };
  });
}

Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    summary: {},
    categoryStats: [],
    trend: []
  },

  onShow() {
    const app = getApp();
    const records = app.globalData.records || [];
    this.setData({
      summary: formatSummary(summarizeRecords(records)),
      categoryStats: buildCategoryStats(records, app.globalData.categories || []),
      trend: buildTrend(records)
    });
  }
});

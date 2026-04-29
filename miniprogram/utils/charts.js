const {
  buildCategoryBreakdown,
  buildTrendBuckets,
  summarizeRecords
} = require('./ledger');
const { formatSummary } = require('./format');

const TREND_TABS = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
];

const BREAKDOWN_TABS = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
];

function withActiveTabs(tabs, activeValue) {
  return tabs.map((tab) => ({
    ...tab,
    active: tab.value === activeValue
  }));
}

function buildChartsViewModel(records, categories, options = {}) {
  const safeRecords = records || [];
  const trendMode = options.trendMode || 'day';
  const breakdownType = options.breakdownType || 'expense';
  const trendLimit = trendMode === 'day' ? 14 : 12;
  const trend = buildTrendBuckets(safeRecords, trendMode, trendLimit);
  const breakdown = buildCategoryBreakdown(safeRecords, categories || [], breakdownType, 8);

  return {
    hasRecords: safeRecords.length > 0,
    isSingleRecord: safeRecords.length === 1,
    emptyTitle: '还没有可观察的账单',
    emptyDesc: '先记录几笔收入或支出，森林观察板会自动长出趋势。',
    stateHint: safeRecords.length === 1
      ? '当前只有 1 笔记录，趋势会随更多账单变得稳定。'
      : '',
    summary: formatSummary(summarizeRecords(safeRecords)),
    trendTabs: withActiveTabs(TREND_TABS, trendMode),
    breakdownTabs: withActiveTabs(BREAKDOWN_TABS, breakdownType),
    trend,
    breakdown
  };
}

module.exports = {
  buildChartsViewModel
};

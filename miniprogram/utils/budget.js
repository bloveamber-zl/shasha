const { formatCurrencyCents } = require('./ledger');

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getCurrentMonth(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

function getMonthOffset(month, offset) {
  const [year, monthIndex] = String(month).split('-').map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 1);
  return getCurrentMonth(date);
}

function getMonthDayCount(month) {
  const [year, monthIndex] = String(month).split('-').map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function getRemainingDaysInMonth(month, now = new Date()) {
  const currentMonth = getCurrentMonth(now);
  const dayCount = getMonthDayCount(month);

  if (month < currentMonth) return 1;
  if (month > currentMonth) return dayCount;

  return Math.max(1, dayCount - now.getDate() + 1);
}

function getTone(percent, remainingCents) {
  if (remainingCents < 0 || percent >= 100) return 'danger';
  if (percent >= 75) return 'warn';
  return 'safe';
}

function buildProgress(amountCents, spentCents) {
  const percent = amountCents > 0 ? Math.round((spentCents / amountCents) * 100) : 0;
  const remainingCents = amountCents - spentCents;

  return {
    amountCents,
    spentCents,
    remainingCents,
    headlineLabel: remainingCents < 0 ? '已超支' : '还可用',
    amount: formatCurrencyCents(amountCents),
    spent: formatCurrencyCents(spentCents),
    remaining: formatCurrencyCents(remainingCents),
    overspent: formatCurrencyCents(Math.max(0, -remainingCents)),
    percent: Math.max(0, Math.min(100, percent)),
    rawPercent: percent,
    tone: getTone(percent, remainingCents)
  };
}

function createCategoryMeta(categories) {
  return (categories || []).reduce((map, category) => {
    map[category.name] = category;
    return map;
  }, {});
}

function sumMonthExpense(records, month, category = '') {
  return (records || [])
    .filter((record) => record.type === 'expense')
    .filter((record) => String(record.date || '').slice(0, 7) === month)
    .filter((record) => !category || record.category === category)
    .reduce((sum, record) => sum + record.amountCents, 0);
}

function findMonthBudget(budgets) {
  return (budgets || []).find((budget) => budget.type === 'month' && budget.amountCents > 0);
}

function buildBudgetViewModel(records, budgets, categories, month = getCurrentMonth(), now = new Date()) {
  const monthBudgetConfig = findMonthBudget(budgets);
  const monthlySpentCents = sumMonthExpense(records, month);
  const monthBudget = monthBudgetConfig
    ? buildProgress(monthBudgetConfig.amountCents, monthlySpentCents)
    : {
      amountCents: 0,
      spentCents: monthlySpentCents,
      remainingCents: 0,
      amount: '0.00',
      spent: formatCurrencyCents(monthlySpentCents),
      remaining: '0.00',
      percent: 0,
      rawPercent: 0,
      tone: 'safe'
    };
  const remainingDays = getRemainingDaysInMonth(month, now);
  const meta = createCategoryMeta(categories);

  monthBudget.dailyAvailableCents = monthBudgetConfig
    ? Math.max(0, Math.round(monthBudget.remainingCents / remainingDays))
    : 0;
  monthBudget.dailyAvailable = formatCurrencyCents(monthBudget.dailyAvailableCents);
  monthBudget.statusText = monthBudgetConfig
    ? `本月还剩 ${remainingDays} 天`
    : '暂未设置月度预算';

  const categoryBudgets = (budgets || [])
    .filter((budget) => budget.type === 'category' && budget.category && budget.amountCents > 0)
    .map((budget) => {
      const category = meta[budget.category] || {};
      return {
        ...buildProgress(budget.amountCents, sumMonthExpense(records, month, budget.category)),
        id: budget.id,
        category: budget.category,
        icon: category.icon || '🌿',
        color: category.color || '#79A86D'
      };
    })
    .sort((a, b) => b.rawPercent - a.rawPercent);

  return {
    month,
    hasBudget: Boolean(monthBudgetConfig || categoryBudgets.length > 0),
    monthBudget,
    categoryBudgets
  };
}

module.exports = {
  buildBudgetViewModel,
  getCurrentMonth,
  getMonthOffset
};

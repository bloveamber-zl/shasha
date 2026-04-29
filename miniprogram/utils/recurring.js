const {
  createLedgerRecord,
  formatCurrencyCents,
  getTodayDate,
  parseTagText
} = require('./ledger');

const FREQUENCY_LABELS = {
  monthly: '每月',
  weekly: '每周',
  custom: '每 N 天'
};

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

function getMonthKey(year, monthIndex) {
  return `${year}-${pad2(monthIndex + 1)}`;
}

function getLastDayOfMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function clampDay(value, min, max) {
  const number = Math.round(Number(value) || min);
  return Math.min(max, Math.max(min, number));
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(startDate, endDate) {
  const diff = toDate(endDate).getTime() - toDate(startDate).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return parseTagText(tags.join(' '));
  }
  return parseTagText(tags);
}

function createRuleId(name) {
  const encoded = encodeURIComponent(name || 'recurring')
    .replace(/%/g, '')
    .slice(0, 24)
    .toLowerCase();
  return `recurring_${encoded || Date.now()}`;
}

function createRecurringRule(input = {}, now = new Date()) {
  const startDate = input.startDate || getTodayDate(now);
  const startDay = Number(startDate.slice(8, 10)) || 1;
  const frequency = FREQUENCY_LABELS[input.frequency] ? input.frequency : 'monthly';
  const name = String(input.name || input.category || '周期账单').trim();

  return {
    id: input.id || createRuleId(name),
    name,
    type: input.type === 'income' ? 'income' : 'expense',
    amountCents: Math.abs(Math.round(Number(input.amountCents) || 0)),
    category: String(input.category || '').trim(),
    account: String(input.account || '').trim(),
    tags: normalizeTags(input.tags),
    note: String(input.note || '').trim(),
    frequency,
    frequencyLabel: FREQUENCY_LABELS[frequency],
    startDate,
    dayOfMonth: clampDay(input.dayOfMonth || startDay, 1, 31),
    intervalDays: clampDay(input.intervalDays || 30, 1, 366),
    enabled: input.enabled !== false,
    createdAt: input.createdAt || now.toISOString(),
    updatedAt: input.updatedAt || now.toISOString()
  };
}

function buildOccurrence(rule, periodKey, dueDate, todayDate) {
  const sign = rule.type === 'income' ? '+' : '-';
  const overdueDays = daysBetween(dueDate, todayDate);

  return {
    key: `${rule.id}:${periodKey}`,
    ruleId: rule.id,
    periodKey,
    name: rule.name,
    dueDate,
    type: rule.type,
    amountCents: rule.amountCents,
    displayAmount: `${sign}${formatCurrencyCents(rule.amountCents)}`,
    category: rule.category,
    account: rule.account,
    tags: rule.tags || [],
    note: rule.note || '',
    frequency: rule.frequency,
    frequencyLabel: rule.frequencyLabel || FREQUENCY_LABELS[rule.frequency],
    overdueDays,
    statusLabel: overdueDays > 0 ? `已到期 ${overdueDays} 天` : '今天到期'
  };
}

function addOccurrenceIfDue(occurrences, rule, periodKey, dueDate, todayDate, confirmedSet) {
  if (dueDate < rule.startDate || dueDate > todayDate) return;
  const key = `${rule.id}:${periodKey}`;
  if (confirmedSet.has(key)) return;
  occurrences.push(buildOccurrence(rule, periodKey, dueDate, todayDate));
}

function buildMonthlyOccurrences(rule, todayDate, confirmedSet) {
  const occurrences = [];
  const start = toDate(rule.startDate);
  const today = toDate(todayDate);
  let year = start.getUTCFullYear();
  let monthIndex = start.getUTCMonth();
  let guard = 0;

  while (
    year < today.getUTCFullYear() ||
    (year === today.getUTCFullYear() && monthIndex <= today.getUTCMonth())
  ) {
    const lastDay = getLastDayOfMonth(year, monthIndex);
    const day = Math.min(rule.dayOfMonth, lastDay);
    const periodKey = getMonthKey(year, monthIndex);
    const dueDate = `${periodKey}-${pad2(day)}`;
    addOccurrenceIfDue(occurrences, rule, periodKey, dueDate, todayDate, confirmedSet);

    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
    guard += 1;
    if (guard > 240) break;
  }

  return occurrences;
}

function buildIntervalOccurrences(rule, todayDate, confirmedSet, intervalDays) {
  const occurrences = [];
  let date = toDate(rule.startDate);
  let guard = 0;

  while (formatDate(date) <= todayDate) {
    const dueDate = formatDate(date);
    addOccurrenceIfDue(occurrences, rule, dueDate, dueDate, todayDate, confirmedSet);
    date = addDays(date, intervalDays);
    guard += 1;
    if (guard > 520) break;
  }

  return occurrences;
}

function buildDueOccurrences(rules = [], confirmedKeys = [], todayDate = getTodayDate()) {
  const confirmedSet = new Set(confirmedKeys || []);

  return (rules || [])
    .map((rule) => createRecurringRule(rule))
    .filter((rule) => rule.enabled && rule.amountCents > 0 && rule.startDate <= todayDate)
    .flatMap((rule) => {
      if (rule.frequency === 'weekly') {
        return buildIntervalOccurrences(rule, todayDate, confirmedSet, 7);
      }
      if (rule.frequency === 'custom') {
        return buildIntervalOccurrences(rule, todayDate, confirmedSet, rule.intervalDays);
      }
      return buildMonthlyOccurrences(rule, todayDate, confirmedSet);
    })
    .sort((a, b) => {
      const dateCompare = a.dueDate.localeCompare(b.dueDate);
      if (dateCompare !== 0) return dateCompare;
      return a.key.localeCompare(b.key);
    });
}

function toSafeRecordId(value) {
  return String(value || '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function buildRecurringRecord(ruleInput, occurrence, now = new Date().toISOString()) {
  const rule = createRecurringRule(ruleInput);

  return createLedgerRecord({
    id: `recurring_${toSafeRecordId(rule.id)}_${toSafeRecordId(occurrence.periodKey)}`,
    amountCents: rule.amountCents,
    type: rule.type,
    category: rule.category,
    account: rule.account,
    date: occurrence.dueDate,
    tags: rule.tags || [],
    note: rule.note || rule.name,
    createdAt: now,
    updatedAt: now
  });
}

function markOccurrenceConfirmed(confirmedKeys = [], occurrenceKey) {
  if (!occurrenceKey || confirmedKeys.includes(occurrenceKey)) {
    return confirmedKeys || [];
  }
  return (confirmedKeys || []).concat(occurrenceKey);
}

function buildRecurringViewModel(rules = [], confirmedKeys = [], todayDate = getTodayDate()) {
  const normalizedRules = (rules || []).map((rule) => createRecurringRule(rule));
  const dueItems = buildDueOccurrences(normalizedRules, confirmedKeys, todayDate);

  return {
    rules: normalizedRules,
    dueItems,
    dueCount: dueItems.length,
    enabledCount: normalizedRules.filter((rule) => rule.enabled).length,
    hasRules: normalizedRules.length > 0,
    hasDue: dueItems.length > 0
  };
}

module.exports = {
  buildDueOccurrences,
  buildRecurringRecord,
  buildRecurringViewModel,
  createRecurringRule,
  markOccurrenceConfirmed
};

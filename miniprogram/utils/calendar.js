const { formatCurrencyCents, sortRecords, summarizeRecords } = require('./ledger');
const { formatSignedRecord, formatSummary } = require('./format');

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getCurrentMonth(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

function getMonthOffset(month, offset) {
  const [year, monthIndex] = String(month).split('-').map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 1);
  return getCurrentMonth(date);
}

function getDateOffset(dateText, offset) {
  const [year, month, day] = String(dateText).split('-').map(Number);
  const date = new Date(year, month - 1, day + offset);
  return formatDate(date);
}

function getMonthStartDate(month) {
  const [year, monthIndex] = String(month).split('-').map(Number);
  return new Date(year, monthIndex - 1, 1);
}

function getCalendarStartDate(month) {
  const firstDay = getMonthStartDate(month);
  const weekday = firstDay.getDay() || 7;
  return getDateOffset(formatDate(firstDay), -(weekday - 1));
}

function sumRecords(records, type) {
  return (records || [])
    .filter((record) => record.type === type)
    .reduce((sum, record) => sum + record.amountCents, 0);
}

function groupByDate(records) {
  return (records || []).reduce((map, record) => {
    if (!map[record.date]) {
      map[record.date] = [];
    }
    map[record.date].push(record);
    return map;
  }, {});
}

function buildDay(date, month, selectedDate, records) {
  const dayRecords = sortRecords(records || []);
  const expenseCents = sumRecords(dayRecords, 'expense');
  const incomeCents = sumRecords(dayRecords, 'income');

  return {
    date,
    day: Number(date.slice(8, 10)),
    inMonth: date.slice(0, 7) === month,
    isSelected: date === selectedDate,
    hasRecords: dayRecords.length > 0,
    count: dayRecords.length,
    expenseCents,
    incomeCents,
    expense: formatCurrencyCents(expenseCents),
    income: formatCurrencyCents(incomeCents)
  };
}

function buildCalendarDays(records, month, selectedDate) {
  const grouped = groupByDate(records);
  const days = [];
  let cursor = getCalendarStartDate(month);

  do {
    days.push(buildDay(cursor, month, selectedDate, grouped[cursor] || []));
    cursor = getDateOffset(cursor, 1);
  } while (days.length < 35 || days.at(-1).date.slice(0, 7) === month);

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push({
      id: `week_${index / 7}`,
      days: days.slice(index, index + 7)
    });
  }
  return weeks;
}

function buildSelectedDay(records, selectedDate) {
  const dayRecords = sortRecords((records || []).filter((record) => record.date === selectedDate));
  return {
    date: selectedDate,
    summary: formatSummary(summarizeRecords(dayRecords)),
    records: dayRecords.map((record) => ({
      ...record,
      displayAmount: formatSignedRecord(record),
      amountClass: record.type === 'income' ? 'amount-income' : 'amount-expense'
    }))
  };
}

function buildCalendarViewModel(records, month = getCurrentMonth(), selectedDate = `${month}-01`) {
  const monthRecords = (records || []).filter((record) => String(record.date || '').slice(0, 7) === month);
  const safeSelectedDate = selectedDate && selectedDate.slice(0, 7) === month ? selectedDate : `${month}-01`;
  const summary = formatSummary(summarizeRecords(monthRecords));

  return {
    month,
    monthLabel: `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`,
    weekdayLabels: ['一', '二', '三', '四', '五', '六', '日'],
    monthSummary: summary,
    weeks: buildCalendarDays(records || [], month, safeSelectedDate),
    selectedDay: buildSelectedDay(records || [], safeSelectedDate)
  };
}

module.exports = {
  buildCalendarViewModel,
  getCurrentMonth,
  getMonthOffset
};

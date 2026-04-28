const { formatCurrencyCents } = require('./ledger');

function formatSignedRecord(record) {
  const sign = record.type === 'income' ? '+' : '-';
  return `${sign}${formatCurrencyCents(record.amountCents)}`;
}

function formatSummary(summary) {
  return {
    income: formatCurrencyCents(summary.incomeCents),
    expense: formatCurrencyCents(summary.expenseCents),
    balance: formatCurrencyCents(summary.balanceCents),
    dailyAverage: formatCurrencyCents(summary.dailyExpenseAverageCents)
  };
}

module.exports = {
  formatSignedRecord,
  formatSummary
};


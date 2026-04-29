const {
  filterRecords,
  formatCurrencyCents,
  summarizeRecords
} = require('./ledger');

const CSV_HEADERS = [
  { key: 'date', label: '日期' },
  { key: 'typeLabel', label: '收支类型' },
  { key: 'amountYuan', label: '金额(元)' },
  { key: 'category', label: '分类' },
  { key: 'account', label: '账户' },
  { key: 'tags', label: '标签' },
  { key: 'note', label: '备注' }
];

function normalizeExportFilters(filters = {}) {
  return {
    startDate: filters.startDate || '',
    endDate: filters.endDate || ''
  };
}

function sortForExport(records) {
  return (records || []).slice().sort((a, b) => {
    const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });
}

function buildLedgerExportRows(records = [], filters = {}) {
  const exportFilters = normalizeExportFilters(filters);
  const filtered = filterRecords(records || [], {
    startDate: exportFilters.startDate,
    endDate: exportFilters.endDate
  });

  return sortForExport(filtered).map((record) => ({
    date: record.date || '',
    typeLabel: record.type === 'income' ? '收入' : '支出',
    amountYuan: formatCurrencyCents(record.amountCents || 0),
    category: record.category || '',
    account: record.account || '',
    tags: (record.tags || []).join(' / '),
    note: record.note || ''
  }));
}

function escapeCsvCell(value) {
  const text = String(value == null ? '' : value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildLedgerCsv(records = [], filters = {}) {
  const rows = buildLedgerExportRows(records, filters);
  const lines = [
    CSV_HEADERS.map((header) => escapeCsvCell(header.label)).join(','),
    ...rows.map((row) => CSV_HEADERS.map((header) => escapeCsvCell(row[header.key])).join(','))
  ];
  return `\ufeff${lines.join('\n')}`;
}

function compactDate(date) {
  return String(date || '').replace(/-/g, '');
}

function buildExportFileName(filters = {}) {
  const { startDate, endDate } = normalizeExportFilters(filters);
  if (!startDate && !endDate) {
    return 'shasha-ledger-all.csv';
  }
  return `shasha-ledger-${compactDate(startDate) || 'start'}-${compactDate(endDate) || 'end'}.csv`;
}

function buildLedgerExportViewModel(records = [], filters = {}) {
  const exportFilters = normalizeExportFilters(filters);
  const rows = buildLedgerExportRows(records, exportFilters);
  const summary = summarizeRecords(filterRecords(records || [], exportFilters));

  return {
    filters: exportFilters,
    rows,
    csv: buildLedgerCsv(records, exportFilters),
    fileName: buildExportFileName(exportFilters),
    recordCount: rows.length,
    income: formatCurrencyCents(summary.incomeCents),
    expense: formatCurrencyCents(summary.expenseCents),
    balance: formatCurrencyCents(summary.balanceCents)
  };
}

module.exports = {
  buildExportFileName,
  buildLedgerCsv,
  buildLedgerExportRows,
  buildLedgerExportViewModel,
  escapeCsvCell,
  normalizeExportFilters
};

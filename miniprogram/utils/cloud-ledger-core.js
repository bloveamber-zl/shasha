const { createLedgerRecord } = require('./ledger');

function buildCloudRecordPayload(record) {
  return {
    amountCents: record.amountCents,
    type: record.type,
    category: record.category,
    account: record.account,
    date: record.date,
    tags: Array.isArray(record.tags) ? record.tags : [],
    note: record.note || ''
  };
}

function normalizeCloudRecord(record) {
  return createLedgerRecord({
    id: record._id || record.id,
    amountCents: record.amountCents,
    type: record.type,
    category: record.category,
    account: record.account,
    date: record.date,
    tags: record.tags || [],
    note: record.note || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
}

function normalizeCloudRecords(records) {
  return (records || [])
    .map(normalizeCloudRecord)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
}

function resolveCloudStatus({ cloudReady, error } = {}) {
  if (!cloudReady) {
    return {
      mode: 'local',
      label: '本地预览模式',
      error: ''
    };
  }

  if (error) {
    return {
      mode: 'fallback',
      label: '云同步失败，已使用本地数据',
      error
    };
  }

  return {
    mode: 'synced',
    label: '云开发已就绪',
    error: ''
  };
}

module.exports = {
  buildCloudRecordPayload,
  normalizeCloudRecord,
  normalizeCloudRecords,
  resolveCloudStatus
};

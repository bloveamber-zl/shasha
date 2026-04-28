function validateRecord(record) {
  if (!record || typeof record !== 'object') return 'INVALID_RECORD';
  if (record.type !== 'income' && record.type !== 'expense') return 'INVALID_TYPE';
  if (!Number.isInteger(record.amountCents) || record.amountCents <= 0) return 'INVALID_AMOUNT';
  if (!record.category) return 'MISSING_CATEGORY';
  if (!record.account) return 'MISSING_ACCOUNT';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || '')) return 'INVALID_DATE';
  return '';
}

function pickEditableRecordFields(record) {
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

function buildCreateData(record, openid, now) {
  return {
    openid,
    ...pickEditableRecordFields(record),
    createdAt: now,
    updatedAt: now
  };
}

function buildUpdateData(record, now) {
  return {
    ...pickEditableRecordFields(record),
    updatedAt: now
  };
}

function canAccessRecord(record, openid) {
  return Boolean(record && record.openid === openid);
}

module.exports = {
  buildCreateData,
  buildUpdateData,
  canAccessRecord,
  validateRecord
};

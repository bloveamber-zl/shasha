const {
  buildCloudRecordPayload,
  normalizeCloudRecords,
  normalizeCloudRecord
} = require('./cloud-ledger-core');

function callFunction(name, data) {
  return wx.cloud.callFunction({
    name,
    data
  }).then((response) => response.result || {});
}

function initCloudUser() {
  return callFunction('initUser', {});
}

function fetchCloudRecords(filters = {}) {
  return callFunction('ledgerQuery', filters).then((result) => {
    if (!result.ok) {
      throw new Error(result.error || 'LEDGER_QUERY_FAILED');
    }
    return normalizeCloudRecords(result.records || []);
  });
}

function createCloudRecord(record) {
  return callFunction('ledgerWrite', {
    action: 'create',
    record: buildCloudRecordPayload(record)
  }).then((result) => {
    if (!result.ok) {
      throw new Error(result.error || 'LEDGER_CREATE_FAILED');
    }

    return normalizeCloudRecord(result.record || {
      ...buildCloudRecordPayload(record),
      _id: result.id,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    });
  });
}

function updateCloudRecord(record) {
  return callFunction('ledgerWrite', {
    action: 'update',
    id: record.id,
    record: buildCloudRecordPayload(record)
  }).then((result) => {
    if (!result.ok) {
      throw new Error(result.error || 'LEDGER_UPDATE_FAILED');
    }

    return normalizeCloudRecord(result.record || {
      ...buildCloudRecordPayload(record),
      _id: result.id || record.id,
      createdAt: record.createdAt,
      updatedAt: result.updatedAt
    });
  });
}

function deleteCloudRecord(id) {
  return callFunction('ledgerWrite', {
    action: 'delete',
    id
  }).then((result) => {
    if (!result.ok) {
      throw new Error(result.error || 'LEDGER_DELETE_FAILED');
    }
    return result;
  });
}

module.exports = {
  initCloudUser,
  fetchCloudRecords,
  createCloudRecord,
  updateCloudRecord,
  deleteCloudRecord
};

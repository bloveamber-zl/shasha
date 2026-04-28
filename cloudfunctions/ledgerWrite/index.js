const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const {
  buildCreateData,
  buildUpdateData,
  canAccessRecord,
  validateRecord
} = require('./ledger-write-core');

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      ok: false,
      error: 'MISSING_OPENID'
    };
  }

  const action = event.action || 'create';
  const now = new Date();

  if (action === 'create') {
    const error = validateRecord(event.record);
    if (error) {
      return {
        ok: false,
        error
      };
    }

    const data = buildCreateData(event.record, openid, now);
    const result = await db.collection('ledger_records').add({ data });

    return {
      ok: true,
      id: result._id,
      createdAt: now,
      updatedAt: now,
      record: {
        _id: result._id,
        ...data
      }
    };
  }

  if (action === 'update') {
    if (!event.id) {
      return {
        ok: false,
        error: 'MISSING_ID'
      };
    }

    const existing = await db.collection('ledger_records').doc(event.id).get();
    if (!canAccessRecord(existing.data, openid)) {
      return {
        ok: false,
        error: 'NOT_FOUND'
      };
    }

    const error = validateRecord(event.record);
    if (error) {
      return {
        ok: false,
        error
      };
    }

    const data = buildUpdateData(event.record, now);
    await db.collection('ledger_records').doc(event.id).update({ data });
    return {
      ok: true,
      id: event.id,
      updatedAt: now,
      record: {
        ...existing.data,
        ...data,
        _id: event.id
      }
    };
  }

  if (action === 'delete') {
    if (!event.id) {
      return {
        ok: false,
        error: 'MISSING_ID'
      };
    }

    const existing = await db.collection('ledger_records').doc(event.id).get();
    if (!canAccessRecord(existing.data, openid)) {
      return {
        ok: false,
        error: 'NOT_FOUND'
      };
    }

    await db.collection('ledger_records').doc(event.id).remove();
    return {
      ok: true
    };
  }

  return {
    ok: false,
    error: 'UNSUPPORTED_ACTION'
  };
};

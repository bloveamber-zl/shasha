const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function validateRecord(record) {
  if (!record || typeof record !== 'object') return 'INVALID_RECORD';
  if (record.type !== 'income' && record.type !== 'expense') return 'INVALID_TYPE';
  if (!Number.isInteger(record.amountCents) || record.amountCents <= 0) return 'INVALID_AMOUNT';
  if (!record.category) return 'MISSING_CATEGORY';
  if (!record.account) return 'MISSING_ACCOUNT';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || '')) return 'INVALID_DATE';
  return '';
}

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

    const result = await db.collection('ledger_records').add({
      data: {
        ...event.record,
        openid,
        createdAt: now,
        updatedAt: now
      }
    });

    return {
      ok: true,
      id: result._id
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
    if (!existing.data || existing.data.openid !== openid) {
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


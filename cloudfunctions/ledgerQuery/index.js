const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      ok: false,
      error: 'MISSING_OPENID',
      records: []
    };
  }

  const query = {
    openid
  };

  if (event.type === 'income' || event.type === 'expense') {
    query.type = event.type;
  }

  if (event.category) {
    query.category = event.category;
  }

  if (event.startDate || event.endDate) {
    query.date = _.and(
      event.startDate ? _.gte(event.startDate) : _.gte('0000-01-01'),
      event.endDate ? _.lte(event.endDate) : _.lte('9999-12-31')
    );
  }

  const result = await db
    .collection('ledger_records')
    .where(query)
    .orderBy('date', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return {
    ok: true,
    records: result.data
  };
};


const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      ok: false,
      error: 'MISSING_OPENID'
    };
  }

  const now = new Date();
  const users = db.collection('users');
  const existing = await users.where({ openid }).limit(1).get();

  if (existing.data.length > 0) {
    await users.doc(existing.data[0]._id).update({
      data: {
        lastSeenAt: now
      }
    });
    return {
      ok: true,
      userId: existing.data[0]._id,
      created: false
    };
  }

  const result = await users.add({
    data: {
      openid,
      nickname: '',
      avatarUrl: '',
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now
    }
  });

  return {
    ok: true,
    userId: result._id,
    created: true
  };
};


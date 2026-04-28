const { sampleRecords, categories, accounts } = require('./utils/mock-data');

App({
  globalData: {
    cloudReady: false,
    records: sampleRecords,
    categories,
    accounts
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
      this.globalData.cloudReady = true;
    }
  }
});


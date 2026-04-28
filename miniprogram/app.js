const { sampleRecords, categories, accounts } = require('./utils/mock-data');
const { resolveCloudStatus } = require('./utils/cloud-ledger-core');
const { initCloudUser, fetchCloudRecords, createCloudRecord } = require('./utils/cloud-ledger');

App({
  globalData: {
    cloudReady: false,
    cloudStatus: resolveCloudStatus({ cloudReady: false }),
    cloudBooted: false,
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
      this.globalData.cloudStatus = resolveCloudStatus({ cloudReady: true });
      this.bootPromise = this.loadCloudRecords();
    } else {
      this.bootPromise = Promise.resolve(this.globalData.records);
    }
  },

  ensureCloudData() {
    return this.bootPromise || Promise.resolve(this.globalData.records);
  },

  setCloudStatus(error) {
    this.globalData.cloudStatus = resolveCloudStatus({
      cloudReady: this.globalData.cloudReady,
      error: error ? String(error.message || error) : ''
    });
  },

  setRecords(records) {
    this.globalData.records = records || [];
  },

  async loadCloudRecords() {
    if (!this.globalData.cloudReady) {
      this.globalData.cloudBooted = true;
      return this.globalData.records;
    }

    try {
      await initCloudUser();
      const records = await fetchCloudRecords();
      this.setRecords(records);
      this.setCloudStatus('');
      return records;
    } catch (error) {
      this.setCloudStatus(error);
      return this.globalData.records;
    } finally {
      this.globalData.cloudBooted = true;
    }
  },

  async saveLedgerRecord(record) {
    if (!this.globalData.cloudReady) {
      this.setRecords([record].concat(this.globalData.records || []));
      return record;
    }

    try {
      const savedRecord = await createCloudRecord(record);
      this.setRecords([savedRecord].concat(this.globalData.records || []));
      this.setCloudStatus('');
      return savedRecord;
    } catch (error) {
      this.setCloudStatus(error);
      this.setRecords([record].concat(this.globalData.records || []));
      return record;
    }
  }
});

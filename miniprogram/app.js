const { sampleRecords, categories, accounts } = require('./utils/mock-data');
const { deleteRecordById, sortRecords, upsertRecord } = require('./utils/ledger');
const { resolveCloudStatus } = require('./utils/cloud-ledger-core');
const {
  initCloudUser,
  fetchCloudRecords,
  createCloudRecord,
  updateCloudRecord,
  deleteCloudRecord
} = require('./utils/cloud-ledger');

App({
  globalData: {
    cloudReady: false,
    cloudStatus: resolveCloudStatus({ cloudReady: false }),
    cloudBooted: false,
    editingRecordId: '',
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
    this.globalData.records = sortRecords(records || []);
  },

  findLedgerRecord(id) {
    return (this.globalData.records || []).find((record) => record.id === id);
  },

  startEditingRecord(id) {
    this.globalData.editingRecordId = id || '';
  },

  consumeEditingRecord() {
    const id = this.globalData.editingRecordId;
    this.globalData.editingRecordId = '';
    return id ? this.findLedgerRecord(id) : null;
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
      this.setRecords(upsertRecord(this.globalData.records || [], record));
      return record;
    }

    try {
      const savedRecord = await createCloudRecord(record);
      this.setRecords(upsertRecord(this.globalData.records || [], savedRecord));
      this.setCloudStatus('');
      return savedRecord;
    } catch (error) {
      this.setCloudStatus(error);
      this.setRecords(upsertRecord(this.globalData.records || [], record));
      return record;
    }
  },

  async updateLedgerRecord(record) {
    if (!this.globalData.cloudReady) {
      this.setRecords(upsertRecord(this.globalData.records || [], record));
      return record;
    }

    try {
      const savedRecord = await updateCloudRecord(record);
      this.setRecords(upsertRecord(this.globalData.records || [], savedRecord));
      this.setCloudStatus('');
      return savedRecord;
    } catch (error) {
      this.setCloudStatus(error);
      this.setRecords(upsertRecord(this.globalData.records || [], record));
      return record;
    }
  },

  async deleteLedgerRecord(id) {
    if (!this.globalData.cloudReady) {
      this.setRecords(deleteRecordById(this.globalData.records || [], id));
      return { ok: true };
    }

    try {
      const result = await deleteCloudRecord(id);
      this.setRecords(deleteRecordById(this.globalData.records || [], id));
      this.setCloudStatus('');
      return result;
    } catch (error) {
      this.setCloudStatus(error);
      this.setRecords(deleteRecordById(this.globalData.records || [], id));
      return { ok: false, error: String(error.message || error) };
    }
  }
});

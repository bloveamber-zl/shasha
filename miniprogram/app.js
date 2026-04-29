const { sampleRecords, categories, accounts, tags, budgets } = require('./utils/mock-data');
const { deleteRecordById, sortRecords, upsertRecord } = require('./utils/ledger');
const { addAccount, addCategory, addTag } = require('./utils/manage');
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
    accounts,
    tags,
    budgets
  },

  onLaunch() {
    this.loadManagedConfig();

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

  addManagedCategory(input) {
    this.globalData.categories = addCategory(this.globalData.categories || [], input);
    this.persistManagedConfig();
    return this.globalData.categories;
  },

  addManagedAccount(name) {
    this.globalData.accounts = addAccount(this.globalData.accounts || [], name);
    this.persistManagedConfig();
    return this.globalData.accounts;
  },

  addManagedTag(name) {
    this.globalData.tags = addTag(this.globalData.tags || [], name);
    this.persistManagedConfig();
    return this.globalData.tags;
  },

  loadManagedConfig() {
    try {
      const config = wx.getStorageSync('shasha_managed_config') || {};
      this.globalData.categories = config.categories || this.globalData.categories;
      this.globalData.accounts = config.accounts || this.globalData.accounts;
      this.globalData.tags = config.tags || this.globalData.tags;
    } catch (error) {
      this.globalData.tags = this.globalData.tags || [];
    }
  },

  persistManagedConfig() {
    try {
      wx.setStorageSync('shasha_managed_config', {
        categories: this.globalData.categories || [],
        accounts: this.globalData.accounts || [],
        tags: this.globalData.tags || []
      });
    } catch (error) {
      this.setCloudStatus(error);
    }
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

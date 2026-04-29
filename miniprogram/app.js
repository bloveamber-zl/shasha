const { sampleRecords, categories, accounts, tags, budgets } = require('./utils/mock-data');
const { deleteRecordById, sortRecords, upsertRecord } = require('./utils/ledger');
const { addAccount, addCategory, addTag } = require('./utils/manage');
const {
  buildRecurringRecord,
  buildRecurringViewModel,
  createRecurringRule,
  markOccurrenceConfirmed
} = require('./utils/recurring');
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
    budgets,
    recurringRules: [],
    recurringConfirmedKeys: []
  },

  onLaunch() {
    this.loadManagedConfig();
    this.loadRecurringConfig();

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

  addRecurringRule(input) {
    const rule = createRecurringRule(input);
    this.globalData.recurringRules = (this.globalData.recurringRules || []).concat(rule);
    this.persistRecurringConfig();
    return rule;
  },

  getRecurringViewModel(todayDate) {
    return buildRecurringViewModel(
      this.globalData.recurringRules || [],
      this.globalData.recurringConfirmedKeys || [],
      todayDate
    );
  },

  async confirmRecurringOccurrence(occurrenceKey) {
    const confirmedKeys = this.globalData.recurringConfirmedKeys || [];
    if (confirmedKeys.includes(occurrenceKey)) {
      return { ok: true, skipped: true };
    }

    const viewModel = this.getRecurringViewModel();
    const occurrence = viewModel.dueItems.find((item) => item.key === occurrenceKey);
    if (!occurrence) {
      return { ok: false, error: 'NO_DUE_OCCURRENCE' };
    }

    const rule = (this.globalData.recurringRules || []).find((item) => item.id === occurrence.ruleId);
    const record = buildRecurringRecord(rule, occurrence);
    this.globalData.recurringConfirmedKeys = markOccurrenceConfirmed(confirmedKeys, occurrenceKey);
    this.persistRecurringConfig();
    const savedRecord = await this.saveLedgerRecord(record);
    return { ok: true, record: savedRecord, occurrence };
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

  loadRecurringConfig() {
    try {
      const config = wx.getStorageSync('shasha_recurring_config') || {};
      this.globalData.recurringRules = Array.isArray(config.rules)
        ? config.rules.map((rule) => createRecurringRule(rule))
        : [];
      this.globalData.recurringConfirmedKeys = Array.isArray(config.confirmedKeys)
        ? config.confirmedKeys
        : [];
    } catch (error) {
      this.globalData.recurringRules = [];
      this.globalData.recurringConfirmedKeys = [];
    }
  },

  persistRecurringConfig() {
    try {
      wx.setStorageSync('shasha_recurring_config', {
        rules: this.globalData.recurringRules || [],
        confirmedKeys: this.globalData.recurringConfirmedKeys || []
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

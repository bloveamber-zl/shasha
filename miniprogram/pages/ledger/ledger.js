const {
  createLedgerRecord,
  formatCurrencyCents,
  getDateOffset,
  getTodayDate,
  parseTagText,
  parseYuanToCents
} = require('../../utils/ledger');

function findAccountIndex(accounts, account) {
  const index = accounts.indexOf(account);
  return index >= 0 ? index : 0;
}

Page({
  data: {
    successImage: '/assets/images/ledger-success.png',
    typeTabs: [
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    activeType: 'expense',
    amountText: '28.60',
    categories: [],
    activeCategory: '',
    accounts: [],
    accountIndex: 0,
    date: '',
    note: '',
    tagText: '',
    isEditing: false,
    editingId: '',
    editingCreatedAt: '',
    saveButtonText: '记好了',
    lastSaved: null
  },

  async onLoad() {
    const app = getApp();
    await app.ensureCloudData();
    this.setData({
      accounts: app.globalData.accounts || [],
      date: getTodayDate()
    });
    this.updateCategories('expense');
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    const editingRecord = app.consumeEditingRecord();
    if (editingRecord) {
      this.loadEditingRecord(editingRecord);
    }
  },

  updateCategories(type, selectedCategory) {
    const app = getApp();
    const categories = (app.globalData.categories || []).filter((item) => item.type === type);
    this.setData({
      categories,
      activeCategory: selectedCategory || (categories[0] ? categories[0].name : '')
    });
  },

  loadEditingRecord(record) {
    const app = getApp();
    const accounts = app.globalData.accounts || [];
    this.setData({
      activeType: record.type,
      amountText: formatCurrencyCents(record.amountCents),
      accountIndex: findAccountIndex(accounts, record.account),
      date: record.date,
      note: record.note || '',
      tagText: (record.tags || []).join('，'),
      isEditing: true,
      editingId: record.id,
      editingCreatedAt: record.createdAt,
      saveButtonText: '保存修改',
      lastSaved: null
    });
    this.updateCategories(record.type, record.category);
  },

  onTypeTap(event) {
    const type = event.currentTarget.dataset.type;
    this.setData({
      activeType: type
    });
    this.updateCategories(type);
  },

  onCategoryTap(event) {
    this.setData({
      activeCategory: event.currentTarget.dataset.name
    });
  },

  onAmountInput(event) {
    this.setData({
      amountText: event.detail.value
    });
  },

  onNoteInput(event) {
    this.setData({
      note: event.detail.value
    });
  },

  onTagInput(event) {
    this.setData({
      tagText: event.detail.value
    });
  },

  onAccountChange(event) {
    this.setData({
      accountIndex: Number(event.detail.value)
    });
  },

  onDateChange(event) {
    this.setData({
      date: event.detail.value
    });
  },

  onDatePresetTap(event) {
    const preset = event.currentTarget.dataset.preset;
    const today = getTodayDate();
    this.setData({
      date: preset === 'yesterday' ? getDateOffset(today, -1) : today
    });
  },

  resetForm() {
    this.setData({
      amountText: '',
      note: '',
      tagText: '',
      isEditing: false,
      editingId: '',
      editingCreatedAt: '',
      saveButtonText: '记好了'
    });
  },

  async saveRecord() {
    const amountCents = parseYuanToCents(this.data.amountText);
    const wasEditing = this.data.isEditing;

    if (!amountCents || amountCents <= 0) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    const record = createLedgerRecord({
      amountCents,
      type: this.data.activeType,
      category: this.data.activeCategory,
      account: this.data.accounts[this.data.accountIndex] || '微信',
      date: this.data.date,
      tags: parseTagText(this.data.tagText),
      note: this.data.note,
      id: this.data.editingId,
      createdAt: this.data.editingCreatedAt
    });

    wx.showLoading({
      title: this.data.isEditing ? '保存中' : '记录中'
    });

    const savedRecord = wasEditing
      ? await app.updateLedgerRecord(record)
      : await app.saveLedgerRecord(record);
    wx.hideLoading();

    this.setData({
      lastSaved: savedRecord
    });
    this.resetForm();

    wx.showToast({
      title: wasEditing ? '已保存' : '记好了',
      icon: 'success'
    });
  }
});

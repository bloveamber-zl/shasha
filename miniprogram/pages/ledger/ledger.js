const { createLedgerRecord, parseYuanToCents } = require('../../utils/ledger');

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
    date: '2026-04-28',
    note: '',
    lastSaved: null
  },

  onLoad() {
    const app = getApp();
    this.setData({
      accounts: app.globalData.accounts || []
    });
    this.updateCategories('expense');
  },

  updateCategories(type) {
    const app = getApp();
    const categories = (app.globalData.categories || []).filter((item) => item.type === type);
    this.setData({
      categories,
      activeCategory: categories[0] ? categories[0].name : ''
    });
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

  saveRecord() {
    const amountCents = parseYuanToCents(this.data.amountText);

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
      tags: [],
      note: this.data.note
    });

    app.globalData.records = [record].concat(app.globalData.records || []);
    this.setData({
      lastSaved: record,
      amountText: '',
      note: ''
    });

    wx.showToast({
      title: '记好了',
      icon: 'success'
    });
  }
});


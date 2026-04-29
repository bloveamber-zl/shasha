const {
  formatCurrencyCents,
  getTodayDate,
  parseTagText,
  parseYuanToCents
} = require('../../utils/ledger');

const frequencyOptions = ['monthly', 'weekly', 'custom'];
const frequencyLabels = ['每月', '每周', '每 N 天'];

function findIndex(items, value) {
  const index = (items || []).indexOf(value);
  return index >= 0 ? index : 0;
}

function decorateRule(rule) {
  const sign = rule.type === 'income' ? '+' : '-';
  const frequencyText = rule.frequency === 'custom' ? `每 ${rule.intervalDays} 天` : rule.frequencyLabel;

  return {
    ...rule,
    displayAmount: `${sign}${formatCurrencyCents(rule.amountCents)}`,
    frequencyText
  };
}

Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    typeTabs: [
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    frequencyLabels,
    frequencyOptions,
    activeType: 'expense',
    nameText: '',
    amountText: '',
    categories: [],
    categoryIndex: 0,
    accounts: [],
    accountIndex: 0,
    frequencyIndex: 0,
    startDate: '',
    dayOfMonthText: '',
    intervalDaysText: '30',
    tagText: '',
    note: '',
    rules: [],
    dueItems: [],
    dueCount: 0,
    enabledCount: 0,
    hasRules: false,
    hasDue: false,
    lastConfirmed: null
  },

  async onLoad() {
    const today = getTodayDate();
    this.setData({
      startDate: today,
      dayOfMonthText: String(Number(today.slice(8, 10)))
    });
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const categories = (app.globalData.categories || []).filter((item) => item.type === this.data.activeType);
    const accounts = app.globalData.accounts || [];
    const viewModel = app.getRecurringViewModel();

    this.setData({
      categories,
      categoryIndex: Math.min(this.data.categoryIndex, Math.max(categories.length - 1, 0)),
      accounts,
      accountIndex: Math.min(this.data.accountIndex, Math.max(accounts.length - 1, 0)),
      rules: viewModel.rules.map(decorateRule),
      dueItems: viewModel.dueItems,
      dueCount: viewModel.dueCount,
      enabledCount: viewModel.enabledCount,
      hasRules: viewModel.hasRules,
      hasDue: viewModel.hasDue
    });
  },

  onTypeTap(event) {
    this.setData({
      activeType: event.currentTarget.dataset.type,
      categoryIndex: 0
    });
    this.refresh();
  },

  onNameInput(event) {
    this.setData({
      nameText: event.detail.value
    });
  },

  onAmountInput(event) {
    this.setData({
      amountText: event.detail.value
    });
  },

  onCategoryChange(event) {
    this.setData({
      categoryIndex: Number(event.detail.value)
    });
  },

  onAccountChange(event) {
    this.setData({
      accountIndex: Number(event.detail.value)
    });
  },

  onFrequencyChange(event) {
    this.setData({
      frequencyIndex: Number(event.detail.value)
    });
  },

  onStartDateChange(event) {
    const startDate = event.detail.value;
    this.setData({
      startDate,
      dayOfMonthText: String(Number(startDate.slice(8, 10)))
    });
  },

  onDayOfMonthInput(event) {
    this.setData({
      dayOfMonthText: event.detail.value
    });
  },

  onIntervalDaysInput(event) {
    this.setData({
      intervalDaysText: event.detail.value
    });
  },

  onTagInput(event) {
    this.setData({
      tagText: event.detail.value
    });
  },

  onNoteInput(event) {
    this.setData({
      note: event.detail.value
    });
  },

  resetForm() {
    this.setData({
      nameText: '',
      amountText: '',
      tagText: '',
      note: ''
    });
  },

  addRule() {
    const amountCents = parseYuanToCents(this.data.amountText);
    if (!amountCents || amountCents <= 0) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }

    const category = this.data.categories[this.data.categoryIndex];
    const account = this.data.accounts[this.data.accountIndex];
    if (!category || !account) {
      wx.showToast({
        title: '请先配置分类和账户',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    app.addRecurringRule({
      name: this.data.nameText || category.name,
      amountCents,
      type: this.data.activeType,
      category: category.name,
      account,
      frequency: this.data.frequencyOptions[this.data.frequencyIndex],
      startDate: this.data.startDate,
      dayOfMonth: Number(this.data.dayOfMonthText),
      intervalDays: Number(this.data.intervalDaysText),
      tags: parseTagText(this.data.tagText),
      note: this.data.note
    });

    this.resetForm();
    this.refresh();
    wx.showToast({
      title: '已添加',
      icon: 'success'
    });
  },

  async confirmDue(event) {
    const key = event.currentTarget.dataset.key;
    wx.showLoading({
      title: '确认中'
    });
    const result = await getApp().confirmRecurringOccurrence(key);
    wx.hideLoading();

    if (!result.ok) {
      wx.showToast({
        title: '已确认或未到期',
        icon: 'none'
      });
      this.refresh();
      return;
    }

    this.setData({
      lastConfirmed: result.record || null
    });
    this.refresh();
    wx.showToast({
      title: result.skipped ? '已确认' : '已入账',
      icon: 'success'
    });
  }
});

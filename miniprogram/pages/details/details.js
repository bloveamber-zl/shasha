const {
  buildInsightSummary,
  filterRecords,
  formatCurrencyCents,
  groupRecordsByDate
} = require('../../utils/ledger');
const { formatSignedRecord, formatSummary } = require('../../utils/format');
const { buildTagOptions } = require('../../utils/manage');

Page({
  data: {
    typeTabs: [
      { label: '全部', value: 'all' },
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    activeType: 'all',
    categoryNames: ['全部'],
    categoryIndex: 0,
    accountNames: ['全部'],
    accountIndex: 0,
    tagNames: ['全部'],
    tagIndex: 0,
    startDate: '',
    endDate: '',
    summaryCards: [],
    topCategory: '暂无',
    topCategoryAmount: '0.00',
    groups: []
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    const categoryNames = ['全部'].concat((app.globalData.categories || []).map((item) => item.name));
    const accountNames = ['全部'].concat(app.globalData.accounts || []);
    const tagNames = ['全部'].concat(buildTagOptions(app.globalData.tags || [], app.globalData.records || []));
    this.setData({
      categoryNames,
      accountNames,
      tagNames
    });
    this.refresh();
  },

  onTypeTap(event) {
    this.setData({
      activeType: event.currentTarget.dataset.type
    });
    this.refresh();
  },

  onCategoryChange(event) {
    this.setData({
      categoryIndex: Number(event.detail.value)
    });
    this.refresh();
  },

  onAccountChange(event) {
    this.setData({
      accountIndex: Number(event.detail.value)
    });
    this.refresh();
  },

  onTagChange(event) {
    this.setData({
      tagIndex: Number(event.detail.value)
    });
    this.refresh();
  },

  onStartDateChange(event) {
    this.setData({
      startDate: event.detail.value
    });
    this.refresh();
  },

  onEndDateChange(event) {
    this.setData({
      endDate: event.detail.value
    });
    this.refresh();
  },

  clearFilters() {
    this.setData({
      activeType: 'all',
      categoryIndex: 0,
      accountIndex: 0,
      tagIndex: 0,
      startDate: '',
      endDate: ''
    });
    this.refresh();
  },

  applyTopCategory() {
    const index = this.data.categoryNames.indexOf(this.data.topCategory);
    if (index > 0) {
      this.setData({
        activeType: 'expense',
        categoryIndex: index
      });
      this.refresh();
    }
  },

  editRecord(event) {
    const id = event.currentTarget.dataset.id;
    const app = getApp();
    app.startEditingRecord(id);
    wx.switchTab({
      url: '/pages/ledger/ledger'
    });
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    const app = getApp();
    wx.showModal({
      title: '删除这笔账？',
      content: '删除后会从当前账本移除。',
      confirmText: '删除',
      confirmColor: '#DD7657',
      success: async (result) => {
        if (!result.confirm) return;
        wx.showLoading({ title: '删除中' });
        await app.deleteLedgerRecord(id);
        wx.hideLoading();
        this.refresh();
        wx.showToast({
          title: '已删除',
          icon: 'success'
        });
      }
    });
  },

  refresh() {
    const app = getApp();
    const selectedCategory = this.data.categoryNames[this.data.categoryIndex];
    const selectedAccount = this.data.accountNames[this.data.accountIndex];
    const selectedTag = this.data.tagNames[this.data.tagIndex];
    const filters = {
      type: this.data.activeType === 'all' ? '' : this.data.activeType,
      category: selectedCategory === '全部' ? '' : selectedCategory,
      account: selectedAccount === '全部' ? '' : selectedAccount,
      tag: selectedTag === '全部' ? '' : selectedTag,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    const records = filterRecords(app.globalData.records || [], filters);
    const summary = buildInsightSummary(records);
    const formatted = formatSummary(summary);
    const displayRecords = records.map((record) => ({
      ...record,
      tags: record.tags || [],
      tagText: (record.tags || []).join(' / '),
      displayAmount: formatSignedRecord(record),
      amountClass: record.type === 'income' ? 'amount-income' : 'amount-expense'
    }));

    this.setData({
      summaryCards: [
        { label: '收入', value: formatted.income },
        { label: '支出', value: formatted.expense },
        { label: '结余', value: formatted.balance },
        { label: '日均支出', value: formatted.dailyAverage }
      ],
      topCategory: summary.topExpenseCategory,
      topCategoryAmount: formatCurrencyCents(summary.topExpenseCategoryCents),
      groups: groupRecordsByDate(displayRecords)
    });
  }
});

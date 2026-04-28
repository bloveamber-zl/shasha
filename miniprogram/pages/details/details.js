const { filterRecords, groupRecordsByDate } = require('../../utils/ledger');
const { formatSignedRecord } = require('../../utils/format');

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
    groups: []
  },

  onShow() {
    const app = getApp();
    const categoryNames = ['全部'].concat((app.globalData.categories || []).map((item) => item.name));
    this.setData({
      categoryNames
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

  refresh() {
    const app = getApp();
    const selectedCategory = this.data.categoryNames[this.data.categoryIndex];
    const filters = {
      type: this.data.activeType === 'all' ? '' : this.data.activeType,
      category: selectedCategory === '全部' ? '' : selectedCategory
    };
    const records = filterRecords(app.globalData.records || [], filters).map((record) => ({
      ...record,
      displayAmount: formatSignedRecord(record),
      amountClass: record.type === 'income' ? 'amount-income' : 'amount-expense'
    }));

    this.setData({
      groups: groupRecordsByDate(records)
    });
  }
});


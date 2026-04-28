const { summarizeRecords } = require('../../utils/ledger');
const { formatSignedRecord, formatSummary } = require('../../utils/format');

Page({
  data: {
    headerImage: '/assets/images/forest-header.png',
    guardianImage: '/assets/images/forest-guardian.png',
    cloudReady: false,
    summaryCards: [],
    recentRecords: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const records = app.globalData.records || [];
    const summary = summarizeRecords(records);
    const formatted = formatSummary(summary);
    const recentRecords = records
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4)
      .map((record) => ({
        ...record,
        displayAmount: formatSignedRecord(record),
        amountClass: record.type === 'income' ? 'amount-income' : 'amount-expense'
      }));

    this.setData({
      cloudReady: app.globalData.cloudReady,
      summaryCards: [
        { label: '本月收入', value: formatted.income, foot: '橡果入账', tone: 'income' },
        { label: '本月支出', value: formatted.expense, foot: '森林花销', tone: 'expense' },
        { label: '结余', value: formatted.balance, foot: `${summary.recordCount} 笔记录`, tone: 'neutral' }
      ],
      recentRecords
    });
  },

  goTab(event) {
    wx.switchTab({
      url: event.currentTarget.dataset.url
    });
  }
});


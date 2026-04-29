const { buildChartsViewModel } = require('../../utils/charts');

Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    summary: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00',
      dailyAverage: '0.00'
    },
    trendTabs: [],
    breakdownTabs: [],
    activeTrendMode: 'day',
    activeBreakdownType: 'expense',
    trend: [],
    breakdown: {
      total: '0.00',
      items: []
    },
    hasRecords: false,
    isSingleRecord: false,
    stateHint: '',
    emptyTitle: '',
    emptyDesc: ''
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    this.refresh();
  },

  onTrendModeTap(event) {
    this.setData({
      activeTrendMode: event.currentTarget.dataset.value
    });
    this.refresh();
  },

  onBreakdownTypeTap(event) {
    this.setData({
      activeBreakdownType: event.currentTarget.dataset.value
    });
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const records = app.globalData.records || [];
    const viewModel = buildChartsViewModel(records, app.globalData.categories || [], {
      trendMode: this.data.activeTrendMode,
      breakdownType: this.data.activeBreakdownType
    });

    this.setData(viewModel);
  }
});

const {
  buildBudgetViewModel,
  getCurrentMonth,
  getMonthOffset
} = require('../../utils/budget');

Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    month: getCurrentMonth(),
    hasBudget: false,
    monthBudget: {
      amount: '0.00',
      spent: '0.00',
      remaining: '0.00',
      overspent: '0.00',
      headlineLabel: '还可用',
      percent: 0,
      dailyAvailable: '0.00',
      statusText: '暂未设置月度预算',
      tone: 'safe'
    },
    categoryBudgets: []
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const viewModel = buildBudgetViewModel(
      app.globalData.records || [],
      app.globalData.budgets || [],
      app.globalData.categories || [],
      this.data.month
    );

    this.setData(viewModel);
  },

  onPrevMonth() {
    this.setData({
      month: getMonthOffset(this.data.month, -1)
    });
    this.refresh();
  },

  onNextMonth() {
    this.setData({
      month: getMonthOffset(this.data.month, 1)
    });
    this.refresh();
  },

  onCurrentMonth() {
    this.setData({
      month: getCurrentMonth()
    });
    this.refresh();
  }
});

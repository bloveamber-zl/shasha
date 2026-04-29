const {
  buildCalendarViewModel,
  getCurrentMonth,
  getMonthOffset
} = require('../../utils/calendar');

Page({
  data: {
    month: getCurrentMonth(),
    selectedDate: '',
    monthLabel: '',
    weekdayLabels: [],
    monthSummary: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00',
      dailyAverage: '0.00'
    },
    weeks: [],
    selectedDay: {
      date: '',
      summary: {
        income: '0.00',
        expense: '0.00',
        balance: '0.00',
        dailyAverage: '0.00'
      },
      records: []
    }
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    const selectedDate = this.data.selectedDate || `${this.data.month}-01`;
    this.setData({ selectedDate });
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const viewModel = buildCalendarViewModel(
      app.globalData.records || [],
      this.data.month,
      this.data.selectedDate || `${this.data.month}-01`
    );
    this.setData(viewModel);
  },

  onPrevMonth() {
    const month = getMonthOffset(this.data.month, -1);
    this.setData({
      month,
      selectedDate: `${month}-01`
    });
    this.refresh();
  },

  onNextMonth() {
    const month = getMonthOffset(this.data.month, 1);
    this.setData({
      month,
      selectedDate: `${month}-01`
    });
    this.refresh();
  },

  onCurrentMonth() {
    const month = getCurrentMonth();
    this.setData({
      month,
      selectedDate: `${month}-01`
    });
    this.refresh();
  },

  onDayTap(event) {
    const date = event.currentTarget.dataset.date;
    const month = date.slice(0, 7);
    this.setData({
      month,
      selectedDate: date
    });
    this.refresh();
  }
});

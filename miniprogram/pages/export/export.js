const { buildLedgerExportViewModel } = require('../../utils/export');
const { getDateOffset, getTodayDate } = require('../../utils/ledger');

function getMonthStart(date) {
  return `${date.slice(0, 7)}-01`;
}

Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    startDate: '',
    endDate: '',
    recordCount: 0,
    income: '0.00',
    expense: '0.00',
    balance: '0.00',
    fileName: 'shasha-ledger-all.csv',
    previewRows: [],
    hasRecords: false,
    lastFilePath: ''
  },

  async onLoad() {
    const today = getTodayDate();
    this.setData({
      startDate: getMonthStart(today),
      endDate: today
    });
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    this.refresh();
  },

  getFilters() {
    return {
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
  },

  getViewModel() {
    const app = getApp();
    return buildLedgerExportViewModel(app.globalData.records || [], this.getFilters());
  },

  refresh() {
    const viewModel = this.getViewModel();
    this.setData({
      recordCount: viewModel.recordCount,
      income: viewModel.income,
      expense: viewModel.expense,
      balance: viewModel.balance,
      fileName: viewModel.fileName,
      previewRows: viewModel.rows.slice(0, 5),
      hasRecords: viewModel.recordCount > 0
    });
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

  useThisMonth() {
    const today = getTodayDate();
    this.setData({
      startDate: getMonthStart(today),
      endDate: today
    });
    this.refresh();
  },

  useRecent30Days() {
    const today = getTodayDate();
    this.setData({
      startDate: getDateOffset(today, -29),
      endDate: today
    });
    this.refresh();
  },

  useAllDates() {
    this.setData({
      startDate: '',
      endDate: ''
    });
    this.refresh();
  },

  exportCsv() {
    const viewModel = this.getViewModel();
    if (!viewModel.recordCount) {
      wx.showToast({
        title: '没有可导出的账单',
        icon: 'none'
      });
      return;
    }

    const basePath = wx.env && wx.env.USER_DATA_PATH ? wx.env.USER_DATA_PATH : '';
    const filePath = `${basePath}/${viewModel.fileName}`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data: viewModel.csv,
      encoding: 'utf8',
      success: () => {
        this.setData({
          lastFilePath: filePath
        });
        wx.showModal({
          title: 'CSV 已生成',
          content: filePath,
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
      }
    });
  },

  copyFilePath() {
    if (!this.data.lastFilePath) return;
    wx.setClipboardData({
      data: this.data.lastFilePath
    });
  }
});

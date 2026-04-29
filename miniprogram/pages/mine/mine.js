Page({
  data: {
    guardianImage: '/assets/images/forest-guardian.png',
    cloudReady: false,
    cloudStatusLabel: '本地预览模式',
    menuItems: [
      { icon: '🌱', title: '预算', desc: '查看本月总预算和分类预算', url: '/pages/budget/budget' },
      { icon: '📅', title: '账单日历', desc: '按日期查看每天的收支流水', url: '/pages/calendar/calendar' },
      { icon: '🗂️', title: '分类管理', desc: '维护餐饮、交通、工资等分类' },
      { icon: '💳', title: '账户管理', desc: '微信、支付宝、银行卡、现金' },
      { icon: '☁️', title: '云同步状态', desc: '后续接入微信云开发真实数据' },
      { icon: '🎨', title: '主题设置', desc: '森林守护灵主题已启用' }
    ]
  },

  async onShow() {
    const app = getApp();
    await app.ensureCloudData();
    this.setData({
      cloudReady: app.globalData.cloudReady,
      cloudStatusLabel: app.globalData.cloudStatus.label
    });
  },

  openMenu(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({
        title: '后续开发',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({ url });
  }
});

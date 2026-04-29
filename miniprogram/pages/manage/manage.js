Page({
  data: {
    tabs: [
      { label: '分类', value: 'category' },
      { label: '账户', value: 'account' },
      { label: '标签', value: 'tag' }
    ],
    typeTabs: [
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    activeTab: 'category',
    categoryType: 'expense',
    nameText: '',
    iconText: '',
    colorText: '',
    categories: [],
    accounts: [],
    tags: []
  },

  onLoad(options = {}) {
    if (options.tab) {
      this.setData({
        activeTab: options.tab
      });
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    this.setData({
      categories: app.globalData.categories || [],
      accounts: app.globalData.accounts || [],
      tags: app.globalData.tags || []
    });
  },

  onTabTap(event) {
    this.setData({
      activeTab: event.currentTarget.dataset.value,
      nameText: '',
      iconText: '',
      colorText: ''
    });
  },

  onTypeTap(event) {
    this.setData({
      categoryType: event.currentTarget.dataset.value
    });
  },

  onNameInput(event) {
    this.setData({
      nameText: event.detail.value
    });
  },

  onIconInput(event) {
    this.setData({
      iconText: event.detail.value
    });
  },

  onColorInput(event) {
    this.setData({
      colorText: event.detail.value
    });
  },

  addItem() {
    const app = getApp();
    const name = this.data.nameText.trim();
    if (!name) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      });
      return;
    }

    if (this.data.activeTab === 'category') {
      app.addManagedCategory({
        name,
        type: this.data.categoryType,
        icon: this.data.iconText,
        color: this.data.colorText
      });
    } else if (this.data.activeTab === 'account') {
      app.addManagedAccount(name);
    } else {
      app.addManagedTag(name);
    }

    this.setData({
      nameText: '',
      iconText: '',
      colorText: ''
    });
    this.refresh();
    wx.showToast({
      title: '已添加',
      icon: 'success'
    });
  }
});

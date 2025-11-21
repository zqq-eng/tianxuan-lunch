Page({
  data: {
    username: '',
    initial: '?',
    goalOptions: ['减脂', '增肌', '增肥', '保持健康'],
    goalIndex: 0,
    weight: '',
    likeTags: ['无糖饮品', '高蛋白', '少油少盐', '主食控量', '高碳补能']
  },
  onShow() {
    const app = getApp();
    const user = app.globalData.currentUser || wx.getStorageSync('currentUser');
    if (user) {
      const name = user.username || '';
      const initial = name ? name.charAt(0).toUpperCase() : '?';
      this.setData({ username: name, initial });
    } else {
      this.setData({ username: '', initial: '?' });
    }
    const profile = app.globalData.userProfile || wx.getStorageSync('userProfile');
    if (profile) {
      const idx = this.data.goalOptions.indexOf(profile.goal);
      this.setData({
        goalIndex: idx >= 0 ? idx : 0,
        weight: profile.weight || ''
      });
    }
  },
  goLogin() {
    wx.redirectTo({ url: '/pages/login/login' });
  },
  onLogout() {
    wx.removeStorageSync('currentUser');
    getApp().globalData.currentUser = null;
    this.setData({ username: '', initial: '?' });
    wx.showToast({ title: '已退出', icon: 'success' });
  },
  onGoalChange(e) {
    this.setData({ goalIndex: Number(e.detail.value) });
  },
  onWeightInput(e) {
    this.setData({ weight: e.detail.value });
  },
  onSaveProfile() {
    const profile = {
      goal: this.data.goalOptions[this.data.goalIndex],
      weight: this.data.weight
    };
    wx.setStorageSync('userProfile', profile);
    getApp().globalData.userProfile = profile;
    wx.showToast({ title: '已保存', icon: 'success' });
  }
});

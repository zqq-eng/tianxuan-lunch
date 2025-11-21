Page({
  data: {
    username: '',
    password: ''
  },
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  onLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入完整信息', icon: 'none' });
      return;
    }
    const users = wx.getStorageSync('users') || [];
    const found = users.find(u => u.username === username && u.password === password);
    if (!found) {
      wx.showToast({ title: '用户名或密码错误', icon: 'none' });
      return;
    }
    wx.setStorageSync('currentUser', found);
    getApp().globalData.currentUser = found;
    wx.showToast({ title: '登录成功', icon: 'success' });
    wx.switchTab({ url: '/pages/index/index' });
  },
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
})

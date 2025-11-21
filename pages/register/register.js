Page({
  data: {
    username: '',
    password: '',
    confirm: ''
  },
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  onConfirmInput(e) {
    this.setData({ confirm: e.detail.value });
  },
  onRegister() {
    const { username, password, confirm } = this.data;
    if (!username || !password || !confirm) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (password !== confirm) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    const users = wx.getStorageSync('users') || [];
    if (users.some(u => u.username === username)) {
      wx.showToast({ title: '用户名已存在', icon: 'none' });
      return;
    }
    const newUser = { username, password, createdAt: Date.now() };
    users.push(newUser);
    wx.setStorageSync('users', users);
    wx.setStorageSync('currentUser', newUser);
    getApp().globalData.currentUser = newUser;
    wx.showToast({ title: '注册成功', icon: 'success' });
    wx.switchTab({ url: '/pages/index/index' });
  }
})

Page({
  data: {
    content: '',
    posts: []
  },
  onShow() {
    const app = getApp();
    const user = app.globalData.currentUser || wx.getStorageSync('currentUser');
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadPosts();
  },
  loadPosts() {
    const posts = wx.getStorageSync('posts') || [];
    this.setData({ posts });
  },
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },
  onPost() {
    const text = (this.data.content || '').trim();
    if (!text) {
      wx.showToast({ title: '写点什么再发吧', icon: 'none' });
      return;
    }
    const now = Date.now();
    const posts = wx.getStorageSync('posts') || [];
    posts.unshift({
      id: now,
      content: text,
      timeStr: this.formatTime(now)
    });
    wx.setStorageSync('posts', posts);
    this.setData({ content: '', posts });
    wx.showToast({ title: '已记录', icon: 'success' });
  },
  formatTime(t) {
    const d = new Date(t);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours();
    const mm = ('' + d.getMinutes()).padStart(2, '0');
    return m + '-' + day + ' ' + h + ':' + mm;
  }
});

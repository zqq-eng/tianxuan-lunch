App({
  globalData: {
    currentUser: null,
    userProfile: null
  },
  onLaunch() {
    const user = wx.getStorageSync('currentUser') || null;
    const profile = wx.getStorageSync('userProfile') || null;
    if (user) this.globalData.currentUser = user;
    if (profile) this.globalData.userProfile = profile;
  }
})

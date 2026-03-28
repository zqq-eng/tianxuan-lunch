// pages/profile/profile.js
Page({
  data: {
    username: '',
    initial: '?',

    // 目标相关
    goalOptions: ['减脂', '增肌', '增肥', '保持健康'],
    goalIndex: 0,
    weight: '',

    // 饮食偏好标签（支持自定义增删改）
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

    // 读取自定义饮食偏好（如果没有就用默认）
    const savedTags = wx.getStorageSync('userLikeTags');
    if (savedTags && Array.isArray(savedTags) && savedTags.length) {
      this.setData({ likeTags: savedTags });
    }
  },

  /* ---------- 登录 / 退出 ---------- */
  goLogin() {
    wx.redirectTo({ url: '/pages/login/login' });
  },

  onLogout() {
    wx.removeStorageSync('currentUser');
    getApp().globalData.currentUser = null;
    this.setData({ username: '', initial: '?' });
    wx.showToast({ title: '已退出', icon: 'success' });
  },

  /* ---------- 目标 & 体重 ---------- */
  onGoalChange(e) {
    this.setData({ goalIndex: Number(e.detail.value) });
  },

  onWeightInput(e) {
    this.setData({ weight: e.detail.value });
  },

  /* ---------- 饮食偏好：自定义增删改 ---------- */

  // 保存标签到本地
  saveLikeTagsToStorage(tags) {
    wx.setStorageSync('userLikeTags', tags);
  },

  // 点击 “＋ 自定义” 新增标签
  onAddLikeTag() {
    const that = this;
    wx.showModal({
      title: '新增饮食偏好',
      editable: true,
      placeholderText: '如：低糖奶茶 / 高纤维 / 不吃辣',
      success(res) {
        if (res.confirm) {
          const text = (res.content || '').trim();
          if (!text) return;
          const list = that.data.likeTags.slice();

          // 避免完全重复
          if (list.indexOf(text) !== -1) {
            wx.showToast({ title: '标签已存在', icon: 'none' });
            return;
          }

          list.push(text);
          that.setData({ likeTags: list });
          that.saveLikeTagsToStorage(list);
        }
      }
    });
  },

  // 点击已有标签 → 修改文字
 // 点击标签：编辑饮食偏好
onEditLikeTag(e) {
  const index = e.currentTarget.dataset.index;
  const current = this.data.likeTags[index] || '';

  wx.showModal({
    title: '🍓 编辑饮食偏好',
    editable: true,
    placeholderText: '输入新的小标签，比如：高纤维·少油盐',
    content: current,
    confirmText: '确定喵~',
    cancelText: '先不改',
    confirmColor: '#ff6b9c',   // 粉色确定按钮
    cancelColor: '#999999',
    success: (res) => {
      if (res.confirm) {
        const v = (res.content || '').trim();
        if (!v) return;
        const list = this.data.likeTags.slice();
        list[index] = v;
        this.setData({ likeTags: list });
        wx.setStorageSync('userLikeTags', list);
      }
    }
  });
},

// 点击“＋ 自定义”：新增饮食偏好
onAddLikeTag() {
  wx.showModal({
    title: '🧁 新增饮食偏好',
    editable: true,
    placeholderText: '例如：高纤维 · 低糖 / 清淡少油',
    confirmText: '添加喵~',
    cancelText: '算了',
    confirmColor: '#ff6b9c',
    cancelColor: '#999999',
    success: (res) => {
      if (res.confirm) {
        const v = (res.content || '').trim();
        if (!v) return;
        const list = this.data.likeTags.slice();
        list.push(v);
        this.setData({ likeTags: list });
        wx.setStorageSync('userLikeTags', list);
      }
    }
  });
},


  // 长按标签 → 删除
  onDeleteLikeTag(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;
    wx.showModal({
      title: '删除这个标签？',
      content: '删除后可重新自定义添加。',
      success(res) {
        if (res.confirm) {
          const list = that.data.likeTags.slice();
          list.splice(index, 1);
          that.setData({ likeTags: list });
          that.saveLikeTagsToStorage(list);
        }
      }
    });
  },

  /* ---------- 保存整体个人信息 ---------- */
  onSaveProfile() {
    const profile = {
      goal: this.data.goalOptions[this.data.goalIndex],
      weight: this.data.weight,
      likeTags: this.data.likeTags   // 把当前偏好一起保存
    };

    wx.setStorageSync('userProfile', profile);
    getApp().globalData.userProfile = profile;
    this.saveLikeTagsToStorage(this.data.likeTags);

    wx.showToast({ title: '已保存', icon: 'success' });
  }
});

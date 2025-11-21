Page({
  data: {
    pools: [],
    categoryOptions: [
      { value: 'restaurant', label: '餐厅' },
      { value: 'main', label: '主食' },
      { value: 'snack', label: '小吃' },
      { value: 'drink', label: '饮料' }
    ],
    categoryIndex: 0,
    form: {
      id: null,
      name: '',
      tag: '',
      lat: '',
      lon: ''
    }
  },
  onShow() {
    this.loadPools();
  },
  loadPools() {
    const pools = wx.getStorageSync('pools') || [];
    this.setData({ pools });
  },
  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },
  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value });
  },
  onTagInput(e) {
    this.setData({ 'form.tag': e.detail.value });
  },
  onLatInput(e) {
    this.setData({ 'form.lat': e.detail.value });
  },
  onLonInput(e) {
    this.setData({ 'form.lon': e.detail.value });
  },
  onSave() {
    const { form, categoryOptions, categoryIndex } = this.data;
    if (!form.name) {
      wx.showToast({ title: '名称必填', icon: 'none' });
      return;
    }
    let pools = wx.getStorageSync('pools') || [];
    const cat = categoryOptions[categoryIndex].value;
    const item = {
      id: form.id || Date.now(),
      name: form.name,
      tag: form.tag,
      category: cat,
      lat: form.lat ? Number(form.lat) : 0,
      lon: form.lon ? Number(form.lon) : 0
    };
    if (form.id) {
      pools = pools.map(p => (p.id === form.id ? item : p));
    } else {
      pools.push(item);
    }
    wx.setStorageSync('pools', pools);
    this.setData({
      pools,
      form: { id: null, name: '', tag: '', lat: '', lon: '' }
    });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const pools = this.data.pools;
    const item = pools.find(p => p.id === id);
    if (!item) return;
    const idx = this.data.categoryOptions.findIndex(c => c.value === item.category);
    this.setData({
      form: {
        id: item.id,
        name: item.name,
        tag: item.tag || '',
        lat: item.lat ? String(item.lat) : '',
        lon: item.lon ? String(item.lon) : ''
      },
      categoryIndex: idx >= 0 ? idx : 0
    });
  },
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这条记录吗？',
      success(res) {
        if (res.confirm) {
          let pools = wx.getStorageSync('pools') || [];
          pools = pools.filter(p => p.id !== id);
          wx.setStorageSync('pools', pools);
          that.setData({ pools });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },
  displayCategory(c) {
    if (c === 'restaurant') return '餐厅';
    if (c === 'main') return '主食';
    if (c === 'snack') return '小吃';
    if (c === 'drink') return '饮料';
    return '其他';
  }
});

// pages/restaurant/restaurant.js
Page({
  data: {
    restaurants: []  // 餐厅列表
  },

  onShow() {
    // 页面每次显示时，从本地存储读取餐厅列表
    const list = wx.getStorageSync('restaurants') || [];
    this.setData({ restaurants: list });
  },

  // 新增餐厅
  onAddRestaurant() {
    wx.navigateTo({
      url: '/pages/restaurantDetail/restaurantDetail?mode=create'
    });
  },

  // 查看某家餐厅的菜品
  goDetail(e) {
    const index = e.currentTarget.dataset.index;
    const restaurants = this.data.restaurants;
    const restaurant = restaurants[index];

    if (!restaurant) {
      console.warn('未找到该餐厅 index =', index);
      wx.showToast({
        title: '餐厅不存在',
        icon: 'none'
      });
      return;
    }

    // 尽量兼容各种 id 字段，地图导入的可能不是 id 这个名字
    const id =
      restaurant.id ||
      restaurant._id ||
      restaurant.poiId ||
      restaurant.uid ||
      index; // 实在没有就用 index 兜底

    wx.navigateTo({
      url: `/pages/restaurantDetail/restaurantDetail?id=${id}&index=${index}`
    });
  },

  // 整家加入抽奖池
  addAllToPool(e) {
    const index = e.currentTarget.dataset.index;
    const restaurants = this.data.restaurants;
    const restaurant = restaurants[index];

    if (!restaurant) {
      wx.showToast({
        title: '餐厅不存在',
        icon: 'none'
      });
      return;
    }

    const dishes = restaurant.dishes || [];
    if (!dishes.length) {
      wx.showToast({
        title: '该餐厅暂无菜品',
        icon: 'none'
      });
      return;
    }

    // 读出原有抽奖池
    const pool = wx.getStorageSync('lotteryPool') || [];

    // 把这家店的菜品全部塞进抽奖池
    dishes.forEach(dish => {
      pool.push({
        ...dish,
        restaurantName: restaurant.name || '',
        restaurantIndex: index
      });
    });

    // 写回本地存储
    wx.setStorageSync('lotteryPool', pool);

    wx.showToast({
      title: '已加入抽奖池',
      icon: 'success'
    });
  },

  // 编辑餐厅信息
  onEditRestaurant(e) {
    const index = e.currentTarget.dataset.index;
    const restaurants = this.data.restaurants;
    const restaurant = restaurants[index];

    if (!restaurant) {
      wx.showToast({
        title: '餐厅不存在',
        icon: 'none'
      });
      return;
    }

    const id =
      restaurant.id ||
      restaurant._id ||
      restaurant.poiId ||
      restaurant.uid ||
      index;

    wx.navigateTo({
      url: `/pages/restaurantDetail/restaurantDetail?mode=edit&id=${id}&index=${index}`
    });
  }
});

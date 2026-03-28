// pages/foodDetail/foodDetail.js

const categoryTextMap = {
  restaurant: "餐厅",
  main: "主食",
  snack: "小吃",
  drink: "饮料"
};

Page({
  data: {
    item: {},
    categoryText: ""
  },

  onLoad(options) {
    const id = options.id;
    const pools = wx.getStorageSync("pools") || [];
    const item = pools.find(p => String(p.id) === String(id));

    if (!item) {
      wx.showToast({ title: "条目不存在", icon: "none" });
      return;
    }

    this.setData({
      item,
      categoryText: categoryTextMap[item.category] || "未分类"
    });
  }
});

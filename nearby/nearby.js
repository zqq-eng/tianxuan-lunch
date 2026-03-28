// pages/nearby/nearby.js
Page({
  data: {},

  // 打开地图选点 → ActionSheet
  onLocate() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        if (!res || !res.latitude || !res.longitude) {
          wx.showToast({ title: "未正确选择地点", icon: "none" });
          return;
        }

        wx.showActionSheet({
          itemList: ["打开地图导航", "加入 / 管理这家餐厅"],
          success(actRes) {
            const index = actRes.tapIndex;
            if (index === 0) {
              // 打开地图导航
              wx.openLocation({
                latitude: res.latitude,
                longitude: res.longitude,
                name: res.name || "选中地点",
                address: res.address || "",
                scale: 17
              });
            } else if (index === 1) {
              // 写入餐厅信息，并跳到餐厅详情页
              const result = that.ensureRestaurant(res);
              const id = result.id;
              wx.navigateTo({
                url: "/pages/restaurantDetail/restaurantDetail?id=" + id
              });
            }
          }
        });
      },
      fail(err) {
        console.error("chooseLocation 失败：", err);
        wx.showToast({
          title: "请在微信中授权定位后再使用",
          icon: "none"
        });
      }
    });
  },

  /**
   * 确保这家餐厅存在于：
   * - 抽奖池 pools（分类为 restaurant）
   * - 餐厅列表 restaurantList（用于管理菜品）
   * 返回 { id, restaurant }
   */
  ensureRestaurant(location) {
    const name = location.name || "未命名餐厅";
    const address = location.address || "";

    // 1）先在抽奖池中处理餐厅
    let pools = wx.getStorageSync("pools") || [];
    let restaurant = pools.find(p =>
      p.category === "restaurant" &&
      p.name === name &&
      (p.address || "") === address
    );

    if (!restaurant) {
      const newId = pools.length
        ? Math.max.apply(
            null,
            pools.map(p => p.id || 0)
          ) + 1
        : 1;

      restaurant = {
        id: newId,
        name,
        category: "restaurant",
        tag: address || "地图选点添加",
        lat: 0,          // 你不想用经纬度，这里直接给 0
        lon: 0,
        address
      };

      pools.push(restaurant);
      wx.setStorageSync("pools", pools);
      wx.showToast({ title: "已加入餐厅抽奖池", icon: "success" });
    }

    // 2）再在 restaurantList 中保证有同一个 id 的餐厅
    let list = wx.getStorageSync("restaurantList") || [];
    let r2 = list.find(r => String(r.id) === String(restaurant.id));

    if (!r2) {
      r2 = {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address || "",
        category: "restaurant",
        lat: 0,
        lon: 0,
        dishes: []      // 在餐厅详情页往这里加主食/小吃/饮料
      };
      list.push(r2);
      wx.setStorageSync("restaurantList", list);
    }

    return { id: restaurant.id, restaurant: r2 };
  }
});

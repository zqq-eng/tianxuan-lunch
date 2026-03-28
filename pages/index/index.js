// pages/index/index.js

// 默认抽取池（本地没有时初始化）
const defaultPools = [
  { id: 1, name: "学校食堂·一楼", category: "restaurant", tag: "便宜量足", lat: 0, lon: 0, address: "" },
  { id: 2, name: "学校食堂·二楼", category: "restaurant", tag: "选择多", lat: 0, lon: 0, address: "" },
  { id: 3, name: "黄焖鸡米饭", category: "main", tag: "米饭+蛋白质", lat: 0, lon: 0, address: "" },
  { id: 4, name: "番茄鸡蛋面", category: "main", tag: "暖胃面食", lat: 0, lon: 0, address: "" },
  { id: 5, name: "烤地瓜", category: "snack", tag: "低脂碳水", lat: 0, lon: 0, address: "" },
  { id: 6, name: "坚果小包", category: "snack", tag: "健康脂肪", lat: 0, lon: 0, address: "" },
  { id: 7, name: "无糖茶", category: "drink", tag: "控糖友好", lat: 0, lon: 0, address: "" },
  { id: 8, name: "纯牛奶", category: "drink", tag: "补蛋白补钙", lat: 0, lon: 0, address: "" }
];

Page({
  data: {
    // 抽取相关
    currentCategory: "restaurant",
    currentCategoryLabel: "餐厅",
    pools: [],
    resultItem: {},
    animationData: {},

    // 默认饮食建议
    slogan: "规律三餐，别熬太晚",
    sloganDetail: "多吃蔬菜和优质蛋白，少喝奶茶，多喝水。",

    // 天气相关
    hasWeather: false,
    loadingWeather: false,
    weather: { city: "", temp: "", text: "" }
  },

  onShow() {
    const app = getApp();
    // 未登录跳转登录
    if (!app.globalData.currentUser && !wx.getStorageSync("currentUser")) {
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }

    this.loadPools();
    this.buildSlogan();
    this.getUserLocationAndWeather && this.getUserLocationAndWeather();
  },

  // 读取/初始化抽取池
  loadPools() {
    let pools = wx.getStorageSync("pools");
    if (!pools || !pools.length) {
      pools = defaultPools;
      wx.setStorageSync("pools", pools);
    }
    this.setData({ pools: pools });
  },

  // 根据时间生成默认饮食建议
  buildSlogan() {
    const hour = new Date().getHours();
    let slogan = "";
    let detail = "";

    if (hour < 11) {
      slogan = "好好吃早饭，今天也要元气满满";
      detail = "可以选择鸡蛋、牛奶和适量的主食，不要只喝饮料就出门。";
    } else if (hour < 17) {
      slogan = "中午别太随便，多吃点蔬菜";
      detail = "主食七分饱，再配一份蛋白质和青菜，比奶茶更顶用。";
    } else {
      slogan = "晚饭适量就好，别撑到睡不着";
      detail = "少油少盐，主食适当减量，睡前 3 小时尽量不再进食。";
    }

    this.setData({
      slogan: slogan,
      sloganDetail: detail
    });
  },

  // 切换分类（餐厅 / 主食 / 小吃 / 饮料）
  onChangeCategory(e) {
    const type = e.currentTarget.dataset.type;
    const map = { restaurant: "餐厅", main: "主食", snack: "小吃", drink: "饮料" };

    this.setData({
      currentCategory: type,
      currentCategoryLabel: map[type] || "餐厅",
      resultItem: {}
    });
  },

  // 抽一抽
  onRandom() {
    const pools = this.data.pools || [];
    const currentCategory = this.data.currentCategory;
    const list = pools.filter(function (p) {
      return p.category === currentCategory;
    });

    if (!list.length) {
      wx.showToast({ title: "该分类下还没有内容", icon: "none" });
      return;
    }

    const idx = Math.floor(Math.random() * list.length);
    const choice = list[idx];

    const that = this;
    this.setData({ resultItem: choice }, function () {
      that.playResultAnimation();
    });
  },

  // 抽取动画
  playResultAnimation() {
    const animation = wx.createAnimation({
      duration: 500,
      timingFunction: "ease-out"
    });

    animation.scale(0.9).step();
    animation.scale(1.05).step();
    animation.scale(1).step();

    this.setData({ animationData: animation.export() });
  },

  // 跳转管理抽取池
  goPool() {
    wx.navigateTo({ url: "/pages/pool/pool" });
  },

  /* ================== 关键修复：地图 → 加入 / 管理餐厅 ================== */

  // 附近找吃的：打开地图 + 加入 / 管理这家餐厅
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
            const idx = actRes.tapIndex;

            // 0. 打开地图导航
            if (idx === 0) {
              wx.openLocation({
                latitude: res.latitude,
                longitude: res.longitude,
                name: res.name || "选中地点",
                address: res.address || "",
                scale: 17
              });
            }

            // 1. 加入 / 管理这家餐厅
            if (idx === 1) {
              // ⭐ 同时保证 restaurantList 和 pools 里都有这一家
              const restaurantId = that.ensureRestaurantInPool(res);
              wx.navigateTo({
                url: `/pages/restaurantDetail/restaurantDetail?id=${restaurantId}`
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
   * 确保这家餐厅：
   * 1）在 restaurantList 里有一条记录（给详情页 / 菜单使用）
   * 2）在 pools 里有一条 category = 'restaurant' 的记录（给抽奖用）
   * 返回：餐厅的 id（字符串）
   */
  ensureRestaurantInPool(location) {
    const name = location.name || "未命名餐厅";
    const address = location.address || "";

    /* ------- 1. 处理 restaurantList ------- */
    let rList = wx.getStorageSync("restaurantList") || [];

    // 先按 名称 + 地址 去匹配老餐厅
    let restaurant = rList.find(r =>
      r.name === name && (r.address || "") === address
    );

    // 如果没有，就新建一条餐厅记录
    if (!restaurant) {
      const newId = rList.length
        ? Math.max.apply(
            null,
            rList.map(r => Number(r.id) || 0)
          ) + 1
        : 1;

      restaurant = {
        id: newId,
        name,
        address,
        category: "restaurant",
        lat: location.latitude || 0,
        lon: location.longitude || 0,
        // 菜单数组，供 restaurantDetail 使用
        dishes: []
      };

      rList.push(restaurant);
      wx.setStorageSync("restaurantList", rList);
    }

    const rid = String(restaurant.id);

    /* ------- 2. 处理 pools（抽奖池） ------- */
    let pools = this.data.pools || [];
    pools = pools.slice(); // 拷贝一份

    let poolItem = pools.find(p =>
      p.category === "restaurant" && String(p.id) === rid
    );

    if (!poolItem) {
      poolItem = {
        id: restaurant.id,       // ⭐ 与 restaurantList 完全一致
        name: restaurant.name,
        category: "restaurant",
        tag: restaurant.address || "地图选点添加",
        lat: restaurant.lat || 0,
        lon: restaurant.lon || 0,
        address: restaurant.address || ""
      };

      pools.push(poolItem);
      wx.setStorageSync("pools", pools);
      this.setData({ pools });
      wx.showToast({ title: "已加入餐厅抽奖池", icon: "success" });
    }

    return rid;
  }

  /* ===== 如果你原来 index.js 下面还有 getUserLocationAndWeather / fetchWeather 之类函数，
     直接保留在这行后面即可，不需要动。 ===== */
});

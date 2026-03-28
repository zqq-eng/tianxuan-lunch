// pages/restaurantDetail/restaurantDetail.js

Page({
  data: {
    restaurantId: "",      // 用字符串存 id
    restaurant: {},
    dishes: []             // 展示用菜品数组
  },

  onLoad(options) {
    const id = options.id ? String(options.id) : "";
    this.setData({ restaurantId: id });
    this.loadRestaurant();
  },

  // 从本地读取餐厅 + 菜品
  loadRestaurant() {
    const rid = this.data.restaurantId;
    const list = wx.getStorageSync("restaurantList") || [];

    const r = list.find(item => String(item.id) === rid);

    if (!r) {
      wx.showToast({ title: "餐厅不存在", icon: "none" });
      return;
    }

    // 兼容字段：dishes / menu
    const dishesRaw = r.dishes || r.menu || [];

    // 构造成前端展示用的结构（带 typeText / inPool）
    const pools = wx.getStorageSync("pools") || [];

    const dishes = dishesRaw.map(d => {
      const id = d.id || Date.now() + Math.random();
      const type = d.type || "main";

      const typeMap = { main: "主食", snack: "小吃", drink: "饮料" };
      const typeText = typeMap[type] || "主食";

      const dishKey = `rest_${r.id}_dish_${id}`;
      const inPool = !!pools.find(p => p.dishKey === dishKey);

      return {
        id,
        name: d.name || "",
        type,
        tag: d.tag || "",
        typeText,
        inPool
      };
    });

    // 把新的 dishes 回写到 restaurant（保证下次读取一致）
    r.dishes = dishes;
    wx.setStorageSync("restaurantList", list);

    this.setData({
      restaurant: r,
      dishes
    });
  },

  /* ========= 添加 / 编辑 / 删除 菜品 ========= */

  // 添加菜品（简单版：只输入菜名和可选标签，类型默认主食）
  onAddDish() {
    const that = this;
    wx.showModal({
      title: "添加菜品",
      editable: true,
      placeholderText: "输入菜品名，如：黄焖鸡米饭",
      success(res) {
        if (!res.confirm) return;
        const name = (res.content || "").trim();
        if (!name) return;

        // 第二步：可选标签
        wx.showModal({
          title: "菜品标签（可选）",
          editable: true,
          placeholderText: "如：高蛋白·减脂友好",
          success(res2) {
            const tag = (res2.content || "").trim();

            // 读出 restaurantList
            let list = wx.getStorageSync("restaurantList") || [];
            const rid = that.data.restaurantId;
            const r = list.find(item => String(item.id) === rid);
            if (!r) {
              wx.showToast({ title: "餐厅不存在", icon: "none" });
              return;
            }

            const dishes = r.dishes || r.menu || [];
            const newId = Date.now();

            const newDish = {
              id: newId,
              name,
              type: "main",   // 先默认主食，有需要你之后可以扩展成 ActionSheet 选择类型
              tag
            };

            dishes.push(newDish);
            r.dishes = dishes;
            r.menu = dishes;   // 兼容一下旧字段

            wx.setStorageSync("restaurantList", list);

            that.setData({
              restaurant: r,
              dishes
            });

            wx.showToast({ title: "已添加菜品", icon: "success" });
          }
        });
      }
    });
  },

  // 编辑菜品名称（简单版）
  onEdit(e) {
    const dishId = String(e.currentTarget.dataset.id);
    const that = this;

    const list = wx.getStorageSync("restaurantList") || [];
    const rid = this.data.restaurantId;
    const r = list.find(item => String(item.id) === rid);
    if (!r) {
      wx.showToast({ title: "餐厅不存在", icon: "none" });
      return;
    }

    const dishes = r.dishes || r.menu || [];
    const dish = dishes.find(d => String(d.id) === dishId);
    if (!dish) return;

    wx.showModal({
      title: "修改菜名",
      editable: true,
      placeholderText: "请输入新的菜名",
      content: dish.name || "",
      success(res) {
        if (!res.confirm) return;
        const name = (res.content || "").trim();
        if (!name) return;

        dish.name = name;

        r.dishes = dishes;
        r.menu = dishes;
        wx.setStorageSync("restaurantList", list);

        that.setData({
          restaurant: r,
          dishes
        });

        wx.showToast({ title: "已修改", icon: "success" });
      }
    });
  },

  // 删除菜品
  onDelete(e) {
    const dishId = String(e.currentTarget.dataset.id);
    const that = this;

    wx.showModal({
      title: "删除菜品",
      content: "确定要删除这道菜吗？",
      success(res) {
        if (!res.confirm) return;

        let list = wx.getStorageSync("restaurantList") || [];
        const rid = that.data.restaurantId;
        const r = list.find(item => String(item.id) === rid);
        if (!r) {
          wx.showToast({ title: "餐厅不存在", icon: "none" });
          return;
        }

        let dishes = r.dishes || r.menu || [];
        dishes = dishes.filter(d => String(d.id) !== dishId);

        r.dishes = dishes;
        r.menu = dishes;
        wx.setStorageSync("restaurantList", list);

        that.setData({
          restaurant: r,
          dishes
        });

        // 同时把抽奖池里这一道菜删掉
        const dishKey = `rest_${r.id}_dish_${dishId}`;
        let pools = wx.getStorageSync("pools") || [];
        pools = pools.filter(p => p.dishKey !== dishKey);
        wx.setStorageSync("pools", pools);

        wx.showToast({ title: "已删除", icon: "success" });
      }
    });
  },

  /* ========= 把菜品加入 / 移出 抽奖池 ========= */

  onTogglePool(e) {
    const dishId = String(e.currentTarget.dataset.id);

    let list = wx.getStorageSync("restaurantList") || [];
    const rid = this.data.restaurantId;
    const r = list.find(item => String(item.id) === rid);
    if (!r) {
      wx.showToast({ title: "餐厅不存在", icon: "none" });
      return;
    }

    const dishes = r.dishes || r.menu || [];
    const dish = dishes.find(d => String(d.id) === dishId);
    if (!dish) return;

    const dishKey = `rest_${r.id}_dish_${dishId}`;

    let pools = wx.getStorageSync("pools") || [];
    const exist = pools.find(p => p.dishKey === dishKey);

    if (exist) {
      // 已在抽奖池 → 移除
      pools = pools.filter(p => p.dishKey !== dishKey);
      wx.showToast({ title: "已从抽奖池移除", icon: "none" });
      dish.inPool = false;
    } else {
      // 不在抽奖池 → 加入
      const categoryMap = { main: "main", snack: "snack", drink: "drink" };
      const category = categoryMap[dish.type] || "main";

      pools.push({
        id: dishKey,
        name: `${r.name}·${dish.name}`,
        category,
        tag: dish.tag || `来自 ${r.name}`,
        lat: r.lat || 0,
        lon: r.lon || 0,
        from: "restaurant",
        dishKey
      });

      wx.showToast({ title: "已加入抽奖池", icon: "success" });
      dish.inPool = true;
    }

    wx.setStorageSync("pools", pools);

    // 同步回写到 restaurantList
    r.dishes = dishes;
    r.menu = dishes;
    wx.setStorageSync("restaurantList", list);

    this.setData({
      restaurant: r,
      dishes
    });
  }
});

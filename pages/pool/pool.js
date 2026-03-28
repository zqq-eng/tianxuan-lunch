Page({
  data: {
    pools: [],
    form: {
      category: "restaurant",
      name: "",
      tag: "",
      calorie: "",
      advantage: "",
      disadvantage: "",
      address: ""
    },
    editingId: null,

    // 🐱 小猫视差偏移
    catOffset1: 0,
    catOffset2: 0,
    catOffset3: 0
  },

  /* =========================================================
     页面显示时加载抽取池
     ========================================================= */
  onShow() {
    this.loadPools();
  },

  loadPools() {
    let pools = wx.getStorageSync("pools") || [];
    pools = pools.map(p => ({
      ...p,
      categoryText: this.mapCategory(p.category)
    }));
    this.setData({ pools });
  },

  mapCategory(cat) {
    switch (cat) {
      case "restaurant": return "餐厅";
      case "main": return "主食";
      case "snack": return "小吃";
      case "drink": return "饮料";
      default: return "其他";
    }
  },

  /* =========================================================
     输入表单绑定
     ========================================================= */
  onSelectCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({
      "form.category": cat
    });
  },

  onInputName(e) { this.setData({ "form.name": e.detail.value }); }
  ,
  onInputTag(e) { this.setData({ "form.tag": e.detail.value }); },
  onInputCalorie(e) { this.setData({ "form.calorie": e.detail.value }); },
  onInputAdvantage(e) { this.setData({ "form.advantage": e.detail.value }); },
  onInputDisadvantage(e) { this.setData({ "form.disadvantage": e.detail.value }); },
  onInputAddress(e) { this.setData({ "form.address": e.detail.value }); },

  /* =========================================================
     提交保存（新增 / 编辑）
     ========================================================= */
  onSubmit() {
    const form = this.data.form;

    if (!form.name.trim()) {
      wx.showToast({ title: "请填写名称", icon: "none" });
      return;
    }

    let pools = wx.getStorageSync("pools") || [];

    // 编辑模式
    if (this.data.editingId) {
      pools = pools.map(item => {
        if (String(item.id) === String(this.data.editingId)) {
          return { ...item, ...form };
        }
        return item;
      });

      wx.showToast({ title: "修改成功", icon: "success" });

    } else {
      // 新增
      const newId =
        pools.length
          ? Math.max(...pools.map(p => Number(p.id) || 0)) + 1
          : 1;

      pools.push({
        id: newId,
        ...form
      });

      wx.showToast({ title: "已添加", icon: "success" });
    }

    wx.setStorageSync("pools", pools);

    this.setData({
      editingId: null,
      form: {
        category: "restaurant",
        name: "",
        tag: "",
        calorie: "",
        advantage: "",
        disadvantage: "",
        address: ""
      }
    });

    this.loadPools();
  },

  /* =========================================================
     编辑条目（自动填入表单）
     ========================================================= */
  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const pools = this.data.pools;
    const item = pools.find(p => String(p.id) === String(id));

    if (!item) {
      wx.showToast({ title: "条目不存在", icon: "none" });
      return;
    }

    this.setData({
      editingId: id,
      form: {
        category: item.category || "restaurant",
        name: item.name || "",
        tag: item.tag || "",
        calorie: item.calorie || "",
        advantage: item.advantage || "",
        disadvantage: item.disadvantage || "",
        address: item.address || ""
      }
    });
  },

  /* =========================================================
     删除条目
     ========================================================= */
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    let pools = wx.getStorageSync("pools") || [];

    pools = pools.filter(p => String(p.id) !== String(id));

    wx.setStorageSync("pools", pools);
    this.loadPools();

    wx.showToast({ title: "已删除", icon: "success" });
  },

  /* =========================================================
     🐱 小猫视差跟随（监听滚动）
     ========================================================= */
  onPageScroll(e) {
    const scrollTop = e.scrollTop;

    
  }
});

const defaultPools = [
  { id: 1, name: '学校食堂·一楼', category: 'restaurant', tag: '便宜量足', lat: 0, lon: 0 },
  { id: 2, name: '学校食堂·二楼', category: 'restaurant', tag: '选择多', lat: 0, lon: 0 },
  { id: 3, name: '黄焖鸡米饭', category: 'main', tag: '米饭+蛋白质', lat: 0, lon: 0 },
  { id: 4, name: '番茄鸡蛋面', category: 'main', tag: '暖胃面食', lat: 0, lon: 0 },
  { id: 5, name: '烤地瓜', category: 'snack', tag: '低脂碳水', lat: 0, lon: 0 },
  { id: 6, name: '坚果小包', category: 'snack', tag: '健康脂肪', lat: 0, lon: 0 },
  { id: 7, name: '无糖茶', category: 'drink', tag: '控糖友好', lat: 0, lon: 0 },
  { id: 8, name: '纯牛奶', category: 'drink', tag: '补蛋白补钙', lat: 0, lon: 0 }
];

Page({
  data: {
    currentCategory: 'restaurant',
    currentCategoryLabel: '餐厅',
    pools: [],
    resultItem: {},
    animationData: {},

    // 默认饮食建议
    slogan: '规律三餐，别熬太晚',
    sloganDetail: '多吃蔬菜和优质蛋白，少喝奶茶，多喝水。',

    // ★ 天气相关
    hasWeather: false,
    loadingWeather: false,
    weather: { city: '', temp: '', text: '' }
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.currentUser && !wx.getStorageSync('currentUser')) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadPools();
    this.buildSlogan();
    // ★ 尝试获取当前位置 + 天气
    this.getUserLocationAndWeather();
  },

  // 读取抽取池
  loadPools() {
    let pools = wx.getStorageSync('pools');
    if (!pools || !pools.length) {
      pools = defaultPools;
      wx.setStorageSync('pools', pools);
    }
    this.setData({ pools });
  },

  // 根据时间段生成默认饮食建议
  buildSlogan() {
    const hour = new Date().getHours();
    let slogan = '';
    let detail = '';
    if (hour < 11) {
      slogan = '好好吃早饭，今天也要元气满满';
      detail = '可以选择鸡蛋、牛奶和适量的主食，不要只喝饮料就出门。';
    } else if (hour < 17) {
      slogan = '中午别太随便，多吃点蔬菜';
      detail = '主食七分饱，再配一份蛋白质和青菜，比奶茶更顶用。';
    } else {
      slogan = '晚饭适量就好，别撑到睡不着';
      detail = '少油少盐，主食适当减量，睡前 3 小时尽量不再进食。';
    }
    this.setData({ slogan, sloganDetail: detail });
  },

  // 切换分类
  onChangeCategory(e) {
    const type = e.currentTarget.dataset.type;
    const map = { restaurant: '餐厅', main: '主食', snack: '小吃', drink: '饮料' };
    this.setData({
      currentCategory: type,
      currentCategoryLabel: map[type] || '餐厅',
      resultItem: {}
    });
  },

  // 抽一抽
  onRandom() {
    const { pools, currentCategory } = this.data;
    const list = pools.filter(p => p.category === currentCategory);
    if (!list.length) {
      wx.showToast({ title: '该分类下还没有内容', icon: 'none' });
      return;
    }
    const idx = Math.floor(Math.random() * list.length);
    const choice = list[idx];
    this.setData({ resultItem: choice }, () => this.playResultAnimation());
  },

  // 抽取动画
  playResultAnimation() {
    const animation = wx.createAnimation({ duration: 500, timingFunction: 'ease-out' });
    animation.scale(0.9).step();
    animation.scale(1.05).step();
    animation.scale(1).step();
    this.setData({ animationData: animation.export() });
  },

  // 跳转管理抽取池
  goPool() {
    wx.navigateTo({ url: '/pages/pool/pool' });
  },

  // 附近餐厅：定位 + 打开地图
  onLocate() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const pools = that.data.pools.filter(p => p.category === 'restaurant' && p.lat && p.lon);
        if (!pools.length) {
          wx.showModal({
            title: '附近餐厅',
            content: '抽取池中的餐厅还没有设置经纬度，可以在“管理抽取池”里填写。',
            showCancel: false
          });
          return;
        }
        const names = pools.map(p => p.name);
        wx.showActionSheet({
          itemList: names,
          success(r) {
            const chosen = pools[r.tapIndex];
            wx.openLocation({
              latitude: chosen.lat,
              longitude: chosen.lon,
              name: chosen.name,
              address: chosen.tag || '天选之饭推荐餐厅',
              scale: 17
            });
          }
        });
      },
      fail() {
        wx.showToast({ title: '定位失败，请检查权限', icon: 'none' });
      }
    });
  },

  // ★ 获取当前位置并拉取天气
  getUserLocationAndWeather() {
    const that = this;
    this.setData({ loadingWeather: true });

    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const { latitude, longitude } = res;
        // 拿到经纬度后，请求天气
        that.fetchWeatherByLocation(latitude, longitude);
      },
      fail() {
        that.setData({ loadingWeather: false });
        wx.showToast({ title: '未授权定位，无法获取当地天气', icon: 'none' });
      }
    });
  },

  // ★ 通过经纬度请求天气（OpenWeather 示例）
  fetchWeatherByLocation(lat, lon) {
    const that = this;
    wx.request({
      url: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      data: {
        lat,
        lon,
        appid: '你的_API_KEY',  // ← 换成你自己申请的 key
        units: 'metric',       // 摄氏度
        lang: 'zh_cn'          // 中文描述
      },
      success(res) {
        if (!res.data || !res.data.weather || !res.data.main) {
          wx.showToast({ title: '天气数据异常', icon: 'none' });
          that.setData({ loadingWeather: false });
          return;
        }

        const city = res.data.name || '本地';
        const temp = res.data.main.temp.toFixed(0);
        const text = res.data.weather[0].description || '';

        that.setData({
          hasWeather: true,
          loadingWeather: false,
          weather: { city, temp, text }
        });
      },
      fail(err) {
        console.error('获取天气失败', err);
        wx.showToast({ title: '网络错误，获取天气失败', icon: 'none' });
        that.setData({ loadingWeather: false });
      }
    });
  }
});

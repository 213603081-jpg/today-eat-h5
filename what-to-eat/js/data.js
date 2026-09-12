// 全部内置吃饭选项；数组与条目保持只读。
(() => {
  const groups = [
    ['东园食堂', '一楼', ['炸酱面', '麻辣烫', '里脊铁板饭', '自选菜']],
    ['韵酒', '一楼', ['蔬菜卷', '炒饭', '山西面', '拉面']],
    ['韵酒', '二楼', ['轻食', '蛋包饭', '叉烧饭', '自选菜']],
    ['东教工食堂', '', ['牛蛙煲', '茄子煲', '黑鸭煲', '番茄鱼面', '麻辣烫']],
    ['学二食堂', '二楼', ['赣味小炒', '炒方便面', '铁板饭', '螺蛳粉', '肠粉', '五谷渔粉', '自选菜']],
    ['学一食堂', '一楼', ['铁板饭', '擂饭']],
    ['东一食堂', '一楼', ['热卤菜', '铁板饭', '北方拌面']],
    ['东一食堂', '二楼', ['轻食']],
  ];
  let number = 0;
  const dishes = groups.flatMap(([placeName, floor, names]) => names.map(name => ({
    id: `dish_${String(++number).padStart(3, '0')}`, type: 'dish', name, placeName, floor, source: 'system',
  })));
  const stores = [
    ['吉野家', '百惠园'], ['氧气层', '百惠园'], ['刘文祥麻辣烫', '生活区门外'],
    ['汉堡王', '百惠园'], ['麦当劳', '喻园'],
  ].map(([name, location], index) => ({
    id: `store_${String(index + 1).padStart(3, '0')}`, type: 'store', name, location, source: 'system',
  }));
  window.systemFoods = Object.freeze([...dishes, ...stores].map(Object.freeze));

  // 来自“食物插图”目录的真实文件名。静态 H5 使用此清单，无需运行时列目录。
  const imageFiles = ['拌面.png', '肠粉.png', '炒饭.png', '炒面.png', '蛋包饭.png', '粉.png',
    '赣味小炒.png', '吉野家.png', '擂饭.png', '螺狮粉.png', '麻辣烫.png', '麦当劳.png',
    '面.png', '轻食.png', '石锅饭.png', '铁板饭.png', '氧气层.png', '自选菜.png', 'Frame.png'];
  window.foodImageFiles = Object.freeze(Object.fromEntries(imageFiles.map(file => [file.replace(/\.[^.]+$/, ''), file])));
  // 仅配置异名对应；同名图片直接查找。不同地点的同名食物自然共用图片。
  window.foodImageMap = Object.freeze({
    '拉面': '面', '山西面': '面', '番茄鱼面': '面',
    '炸酱面': '拌面', '北方拌面': '拌面', '炒方便面': '炒面',
    '五谷渔粉': '粉', '里脊铁板饭': '铁板饭', '刘文祥麻辣烫': '麻辣烫',
    '蔬菜卷': '轻食', '螺蛳粉': '螺狮粉', '牛蛙煲': '石锅饭',
    '茄子煲': '石锅饭', '黑鸭煲': '石锅饭', '汉堡王': '麦当劳',
    '叉烧饭': 'Frame', '热卤菜': '麻辣烫',
  });
})();

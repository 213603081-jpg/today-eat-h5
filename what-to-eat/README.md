# 华科东区 · 今天吃什么

原生 HTML / CSS / JavaScript H5，无后端、无构建步骤、无运行时第三方依赖。

## 当前功能

固定从 35 个内置选项（30 个食堂菜品、5 个独立店铺）中等概率抽取，避免连续抽到同一条选项。仅保留首页与结果页，已移除菜库、添加内容、筛选及 localStorage 读写逻辑。浏览器之前保存的数据不主动清除，也不再参与抽取。

首页点击“开始抽取”，扭蛋机动画播放一次后衔接半透明黑色蒙版上的扭蛋打开动画。打开动画停在末帧，显示“点击屏幕任意位置查看结果”，点击后在同一蒙版内让扭蛋淡出、结果纸张弹窗浮现。弹窗“确定”或下方叉号淡出后返回首页；“重新抽取”先回首页，再完整播放机器抽取、打开扭蛋和点击查看结果的循环。

## 运行与部署

在父目录（吃点什么吧）执行 `python -m http.server 8000 --bind 0.0.0.0`，访问 `http://localhost:8000/what-to-eat/`。动画清单使用 fetch，完整流程需要 HTTP 服务，不能直接使用 file://。

同一局域网手机可访问 `http://电脑局域网IP:8000/what-to-eat/`，需保持服务运行且网络允许设备互访。公网部署时上传 HTML、CSS、JS 及其引用的 assets 和“食物插图”资源到静态托管服务，无需路由重写。当前未部署公网。

## 文件与素材

- `index.html`：首页、结果页、动画蒙版。
- `css/style.css`：拼贴布局、按钮与动画蒙版。首页按钮相对原位置向下移动 28px。
- `js/app.js`：随机、页面切换、两段动画的共享播放器和点击确认。
- `js/data.js`：只读的内置选项。
- `assets/machine/`：扭蛋机静态首帧、图集和时长清单（181 帧，6100 ms）。
- `assets/opening/`：扭蛋打开素材（101 帧，3360 ms）。
- `assets/prepare-animation.py`：使用 Pillow 生成机器图集；加 `--opening` 生成打开动画。运行网页不需要 Python。
- `assets/prepare-home.py`：按 Figma 裁切参数导出贴纸。

首页参考 Figma 文件 `599jw6tmuh1bXDVPgE4u6B`、Page 2 节点 `109:311`，适配基准 390 × 844。素材使用本地文件。原始 GIF 保留，部署不必上传原始 GIF 或未引用的素材表。

播放器按需解码当前和下一张图集，后台暂停，切页取消，加载失败可重试；实际时长可能因加载略长。结果名称优先使用 YS HelloFont BangBangTi，本机需字由激活；未提供移动端可嵌入字体文件，缺失时使用系统字体。

## 验证

本地 8000 服务启动后，在父目录、具有 Playwright 和 Edge 的环境执行：

```sh
node smoke-test.cjs
node home-test.cjs
node opening-test.cjs
node result-test.cjs
```

覆盖抽取与重抽、结果确认、动画生命周期、末帧等待点击、失败恢复、切页取消、按钮位置与响应式布局。使用移动视口模拟，尚未进行 iOS / Android 真机测试。

## 结果插画与店铺地点

“食物插图/”中的 19 个真实 PNG 文件通过 data.js 的 foodImageFiles 清单查找。同名优先，异名使用统一 foodImageMap，不在每条选项里重复存储图片路径。新增图片后需同步清单。所有 35 条记录已有对应图片；找不到或加载失败时使用 assets/food-placeholder.svg。

煲类使用“石锅饭”，汉堡王共用“麦当劳”，叉烧饭使用实际文件“Frame.png”（目录中没有 frame1），热卤菜使用“麻辣烫”，螺蛳粉使用实际文件“螺狮粉.png”。原 PNG 文件保持不变。

独立店铺以 location 记录地点：吉野家、氧气层、汉堡王在百惠园；刘文祥麻辣烫在生活区门外；已有麦当劳补充为喻园，没有重复加入随机池。

运行 node image-test.cjs（在父目录执行） 可验证全部图片映射、店铺地点、结果图片加载和缺图回退。

## 结果弹窗

机器动画结束后，点击蒙版任意位置可将剩余扭蛋入场和打开动画加速至 4 倍速，不增加提示文字。每次重新抽取恢复正常速度，末帧仍等待点击查看结果。

按 Figma Page 2 最新结果 Frame（120:3，402 × 874）比例布局，使用用户提供的“弹窗背景.png”“确定按钮.png”“重新抽取.png”，并保留素材自带装饰。地点和关闭图标使用 Figma 原始导出。结果弹窗与打开动画共用蒙版，转场不隐藏背景层；结果图片在抽取时预加载。确认和叉号返回首页，重新抽取重走完整流程。短屏按比例缩放，按钮点击区域至少 44px。

## 代码整理后的目录与路径

```text
吃点什么吧/
├─ what-to-eat/
│  ├─ index.html
│  ├─ css/style.css
│  ├─ js/app.js
│  ├─ js/data.js
│  ├─ data/machine-manifest.json
│  ├─ data/opening-manifest.json
│  └─ README.md
├─ assets/                  # 图片、动画图集仍在原位
├─ 食物插图/                 # 食物插画仍在原位
└─ *test.cjs                # 开发验证脚本，非网页运行依赖
```

动画 JSON 清单属于运行所需的数据，已移至 what-to-eat/data；对应 WebP 图集未移动。assets 中离线素材处理脚本保留原位，动画生成脚本已改为向新的 data 目录写入清单。

HTML 与 JavaScript 通过 ../assets/ 和 ../食物插图/ 使用原素材，CSS 通过 ../../assets/ 引用。必须从父目录启动静态服务；仅上传或单独托管 what-to-eat 文件夹将缺少素材。以后部署时需要同时保留 what-to-eat、assets、食物插图 三个目录的相对位置。

新入口：http://localhost:8000/what-to-eat/#home 。原根目录的 index.html 已迁移，旧入口不再是应用页面。
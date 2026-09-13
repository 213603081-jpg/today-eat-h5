# 华科东区 · 今天吃什么

原生 HTML / CSS / JavaScript H5，无后端、登录、构建步骤或运行时第三方依赖。

从 35 个内置吃饭选项中随机抽取，避免连续重复。机器抽取后衔接扭蛋打开动画；打开阶段点击可加速，末帧点击展示结果；确定返回首页，重新抽取重复完整流程。

## 部署目录

```text
index.html
style.css
app.js
data.js
machine-manifest.json
opening-manifest.json
assets/
  food/      # 19 张共用食物插画
  machine/   # 首帧 + 31 张动画图集
  opening/   # 首帧 + 17 张动画图集
  ui/        # 17 张实际引用的界面图片/图标
  other/     # 缺图占位 SVG
```

所有资源均在仓库内部，使用相对路径，文件名大小写与引用一致。JSON 播放清单保留在根目录，图集路径由 app.js 中的资源目录与清单文件名拼接。

在仓库根目录执行 `python -m http.server 8000`，访问 `http://localhost:8000/`。完整动画流程需要 HTTP 服务，不支持直接双击 file:// 打开。

部署时发布整个仓库根目录即可，无需构建。支持域名根路径或 GitHub Pages 的仓库子路径。仓库不包含开发测试脚本、参考图、临时预览图、素材处理脚本或未被引用的原始 GIF。

## 素材与字体

35 条选项通过 data.js 中的同名文件清单和 foodImageMap 共用 19 张图片，加载失败回退到 assets/other/food-placeholder.svg。图片和动画图集保持原文件内容，没有压缩或视觉修改。

机器动画 181 帧，打开动画 101 帧，由 WebP 图集和 JSON 时长清单播放，无需原始 GIF 或视频。播放器按需解码、后台暂停、切页取消，打开动画末帧保持。

结果名称保留 YS HelloFont BangBangTi 的字体偏好；项目没有提供或引用可嵌入的字体文件，未安装该字体时按现有 CSS 回退到系统字体。本次未更改字体或页面视觉。

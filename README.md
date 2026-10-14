# Hill Climber

一个基于 Matter.js 的爬山车进化训练小游戏：AI 通过神经进化（Neuroevolution）学习驾驶小车翻越随机生成的地形，追逐墙在身后紧逼，油桶提供续航，水域会减速并加倍耗油。

> 原始版本为单文件 `HillClimber.html`，本仓库已按 FlappyLearning-gh-pages 的工程结构重构为多文件，便于阅读与维护。原单文件保留在 `HillClimber.html` 未删除。

## 目录结构

```
HillClimber/
├── index.html          # 页面入口：HTML 结构 + 脚本引入顺序
├── style.css           # 全局样式
├── Neuroevolution.js   # 神经进化框架（网络、基因、育种、世代管理）
├── maps.js             # 地图定义（gentle / hills / mountains / watery）
├── settings.js         # 全局参数与侧栏 UI 读写
├── terrain.js          # 无限地形生成 + 油桶布局
├── physics.js          # Matter.js 引擎与世界、地形 chunk 物理
├── vehicle.js          # 车辆物理（底盘、轮子、控制、翻转、燃油）
├── state.js            # 全局状态 + 键盘输入
├── game.js             # AI 输入 / 回合与进化流程 / 物理步进 / 主循环
├── render.js           # Canvas 渲染（地形、车辆、HUD）+ 训练曲线
├── persist.js          # 存档：localStorage / JSON 导入导出 / 重置
└── boot.js             # 启动入口
```

## 运行方式

任意静态文件服务器直接访问 `index.html` 即可，例如：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/index.html
```

## 操作说明

- 模式：Player Mode（手动驾驶，A/D 或方向键/空格）/ AI Training（自动训练）/ AI vs Player（人机同场）
- 速度：x1 / x2 / x3 / MAX
- 右侧面板可实时调整物理、燃油、追逐与进化参数；更改进化参数后需 Apply & Restart Training
- 训练进度可保存到浏览器（localStorage）、导出/导入 JSON 文件

## 脚本加载顺序（勿轻易调整）

`index.html` 中的引入顺序即依赖顺序：Neuroevolution → maps → settings → terrain → physics → vehicle → state → game → render → persist → boot。各文件在全局作用域共享状态与函数，`boot.js` 负责初始化启动。
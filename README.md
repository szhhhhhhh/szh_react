├── public
│ ├── index.html 主页面
│ ├── msg.html 用 messageChannel 模拟 requestIdleCallback 以兼容非谷歌浏览器不支持的情况
│ ├── raf.html 用 requestAnimationFrame 来检测当前机器每一帧执行时间
│ ├── ric.html 用 requestIdleCallback 来实现 react 机制
│ └── ...
├── src
│ ├── render
│ │ ├── v15.js 模拟 react16 以前的渲染机制
│ │ ├── v16.8.js 模拟 react16 以后的渲染机制
│ │ └── ...
│ ├── updateQueue
│ │ ├── index.js 模拟 react 更新队列机制
│ │ └── ...
│ └── index.js 一个基础的 dom 结构来测试本项目中手写的 react
├── node_modules
│ └── ...
├── package.json
└── ...

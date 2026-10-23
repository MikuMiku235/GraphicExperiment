# 实验一 · 机械臂仿真（一）· 工程骨架

> 本目录是**给你动手改的工程**。已经跑得起来的部分是环境与渲染骨架，
> 标了 `TODO(STEP n)` 的地方才是本实验要你写的代码。

## 1. 启动

```bash
cd E:\Workspace\GraphicExperiment\lab1
node server.js
# 浏览器打开 http://localhost:8080
```

必须是 `http://localhost`，**不能**双击打开 `index.html`（ES Module 与 GLB 会被同源策略拦截）。

## 2. 目录

```
lab1/
├─ server.js          零依赖静态服务器（已给）
├─ index.html         页面外壳 + importmap（已给）
├─ src/
│  ├─ config.js       常量：模型路径、缩放系数、关节名（已给）
│  ├─ main.js         主程序：场景、相机、灯光、主循环、遥测（已给，只读理解）
│  ├─ robot.js        ★ 模型加载（已给）+ 关节表 / 驱动 / 位姿（TODO）
│  ├─ ui.js           ★ 示教器面板：安全与速度（已给）+ 关节滑块（TODO）
│  └─ analysis.js     ★ 轨迹记录 / 可达区域采样（TODO，对应要求 c、d）
├─ assets/            模型四件套 + 标定提示模型
└─ vendor/three/      three.js r186 与 addons（本地副本，无需联网）
```

## 3. 五个 STEP（对照指导手册的阶段）

| STEP | 文件 | 内容 | 手册阶段 |
|---|---|---|---|
| 3 | `src/robot.js` → `buildJointTable()` | traverse 建关节表、qZero、限位对拍 | 阶段三 |
| 4 | `src/robot.js` → `setJoint()` | 限位钳制 + `q = qZero · Ry(θ)` | 阶段四 |
| 5 | `src/robot.js` → `readTCPPose()` | 读 matrixWorld → 位姿读数 | 阶段五 |
| 6 | `src/ui.js` → 关节滑块 | 5 个滑块 ↔ setJoint | 阶段四 |
| 7 | `src/analysis.js` | TCP 轨迹 CSV / 蒙特卡洛点云 | 阶段六、七 |

> ⚠ 两个素材陷阱（详见指导手册阶段二/三）：
> 1. GLB **没有** `userData.joint/axis/limit`（讲义 P18 的写法在这里会拿到 0 个关节），只能按节点名字 `J1..J5` 找；
> 2. 关节轴是节点**局部 +Y**，不是 +Z（Blender 的 +Z 经 glTF Y-up 重标定后变成 +Y）。
>    用 +Z 会整体差 90°，判据：J5 转动时 TCP 位置必须不变。

## 4. 自检

打开页面后看左上角状态行：

- `模型已加载：? 个关节 · 节点总数 15` → 模型 OK；
- `⚠ 关节表为空` → 还没做 STEP 3，正常；
- 拖动右侧面板"关节"滑块，机械臂应能绕各关节转动，位姿面板实时刷新。

地址栏加 `?debug=1` 会显示每个关节的世界转轴（红色箭头），用来排查"关节转向不对"。

## 5. 约定

- 内部角度一律用**弧度**，界面显示用**度**；
- 位姿位置单位 **米**，保留 4 位小数；
- 急停优先级最高：`state.estop === true` 时任何运动指令都不执行。

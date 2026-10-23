# 计算机图形与动画 · 机械臂仿真实验仓库

本仓库是「机械臂仿真」系列实验（Three.js / WebGL）的完整工作区：**实验讲义、模型素材、AI 助教指导包、可运行工程骨架**都在里面。

> 给队友：本文档教你从零把实验跑起来（约 5 分钟）。仓库已包含全部依赖与素材，**不需要联网、不需要 `npm install`**。

---

## 目录

- [1. 三步跑起来](#1-三步跑起来)
- [2. 环境要求与安装](#2-环境要求与安装)
- [3. 验收：看到这些才算成功](#3-验收看到这些才算成功)
- [4. 仓库结构](#4-仓库结构)
- [5. 怎么做实验](#5-怎么做实验)
- [6. 常见问题](#6-常见问题)
- [7. 协作约定（Git）](#7-协作约定git)
- [8. 版本与致谢](#8-版本与致谢)

---

## 1. 三步跑起来

```bash
# ① 克隆（把 <repo-url> 换成你们的仓库地址）
git clone <repo-url> GraphicExperiment
cd GraphicExperiment/lab1

# ② 启动本地静态服务器（零依赖，不需要 npm install）
node server.js
```

```text
  实验一 · 机械臂仿真（一）
  本地服务已启动: http://localhost:8080
  停止: Ctrl+C
```

③ 浏览器打开 **<http://localhost:8080>**。

> ⚠ 不能双击 `lab1/index.html` 打开。ES Module 和 GLB 模型都要走 `fetch`，`file://` 协议下会被浏览器同源策略拦截——必须通过 `http://localhost` 访问。

---

## 2. 环境要求与安装

### 2.1 必需

| 依赖 | 要求 | 本仓库验证过的版本 | 用途 |
|---|---|---|---|
| **Node.js** | ≥ 18（LTS 即可） | **v24.13.0** | 运行 `lab1/server.js` 静态服务器 |
| **现代浏览器** | 支持 WebGL 2 | Edge / Chrome（Chromium ≥ 110）、Firefox ≥ 110 | 渲染 Three.js 场景 |
| Git | 任意近版本 | — | 克隆仓库 |

> **不需要**：`npm install`、`three`、`vite`、Python、任何构建工具。
> three.js 已本地化在 `lab1/vendor/three/`（r0.186，MIT），模型在 `lab1/assets/`，全部离线可用。

### 2.2 安装 Node.js

**Windows（PowerShell，推荐用 winget）**

```powershell
winget install --id OpenJS.NodeJS.LTS -e
# 装完重开终端再验证
node -v
npm -v
```

或到 <https://nodejs.org/zh-cn> 下载 LTS 的 `.msi` 安装包，一路默认即可。

**macOS**

```bash
brew install node          # 或到 nodejs.org 下载 .pkg
node -v
```

**Linux（Debian/Ubuntu）**

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

> Node 装完后**新开一个终端**，否则 `node` 命令可能还不在 PATH 里。

**Git**（没有的话）：Windows `winget install --id Git.Git -e`；macOS `brew install git`；Linux `sudo apt install git`。

### 2.3 浏览器

推荐 Chrome 或 Edge（Chromium 内核，three.js 兼容性最好）。Firefox 也可以。
检查 WebGL：地址栏输入 `chrome://gpu`，看 **WebGL2: Hardware accelerated**。或访问 <https://get.webgl.org/webgl2/> 确认。

### 2.4 可选工具（只在做「交付物」时需要）

| 工具 | 用途 | 安装 |
|---|---|---|
| **ScreenToGif**（Windows） | 录制实验要求 b 的连续动作 GIF | `winget install --id NickeManarin.ScreenToGif -e` |
| **OBS Studio**（全平台） | 同上，可录 MP4 | `winget install --id OBSProject.OBSStudio -e` |
| **ffmpeg** | MP4 → GIF、裁剪、压缩 | `winget install --id Gyan.FFmpeg -e`（macOS `brew install ffmpeg`） |

> 报告里的轨迹 CSV 可以用 Excel / Numbers / LibreOffice 打开；如果用 Excel 出现中文乱码，请以「数据 → 从文本/CSV（UTF-8）」导入。

### 2.5 关于端口

默认 8080。被占用时换一个：

```powershell
# PowerShell
$env:PORT=8081; node server.js
# cmd
set PORT=8081 && node server.js
# macOS / Linux
PORT=8081 node server.js
```

---

## 3. 验收：看到这些才算成功

打开 <http://localhost:8080> 后：

- [ ] 左侧出现一台**白色 Han's Robot 五轴协作臂**，可左键旋转 / 右键平移 / 滚轮缩放；
- [ ] 右侧是「虚拟示教器」面板：关节滑块、TCP 位姿读数、急停按钮；
- [ ] 左上角状态行显示：

```text
模型已加载：0 个关节 · 节点总数 15
tcp 节点：tcp · 包围盒（米）0.68 × 1.35 × 0.95
⚠ 关节表为空：请完成 STEP 3（robot.js）
```

`0 个关节`、`—` 的位姿读数是**正常的骨架状态**——关节表要你按 `guide/04` 实现 `TODO(STEP 3)`。
完成 STEP 3–5 后应变成：`5 个关节`、TCP 读数 `(-0.1601, 1.2491, -0.5127)`、RPY 全 0（参考图见 `guide/img/app_reference.png`）。

若浏览器 Console（F12）报 404 / 跨域 / `Error creating WebGL context`，先看[常见问题](#6-常见问题)。

---

## 4. 仓库结构

```text
GraphicExperiment/
├─ README.md                  ← 本文档（队友上手）
├─ AGENTS.md                  ← AI 助教工作规范（路径均相对仓库根）
├─ docs/                      ← 实验讲义（PPT，只读）
├─ Materials/                 ← 实验素材：模型、压缩包（只读）
├─ guide/                     ← 实验一指导包（8 学时、阶段 0–9）
│  ├─ README.md               ← 指导包总览：路线 / 关口 / 速查
│  ├─ 01_素材核验报告.md        ← 模型审计（单位、坐标系、关节轴、讲义 10 处不一致）
│  ├─ 02_Games101笔记对应.md    ← 知识点 ↔ 课程笔记映射（队友可忽略）
│  ├─ 03_阶段0-2_环境与素材.md
│  ├─ 04_阶段3-5_关节驱动与FK验证.md
│  ├─ 05_阶段6-9_四项任务.md
│  ├─ 06_验收清单与报告模板.md
│  └─ img/                    ← 参考截图
├─ lab1/                      ← 实验一工程（你要动手的地方）
│  ├─ README.md               ← 工程说明与 5 个 STEP
│  ├─ server.js               ← 零依赖静态服务器
│  ├─ index.html              ← 页面外壳 + importmap
│  ├─ src/                    ← main.js（已给）、robot.js / ui.js / analysis.js（TODO）
│  ├─ assets/                 ← GLB + joint_map.json + robot_spec.yaml + robot.urdf
│  └─ vendor/three/           ← three.js 与 addons（离线）
└─ CurrentSchedule/           ← 实验进度记录 ADD(n).md
```

体积参考（不含本机 `.agent-work/`）：`docs/` 19.8 MB、`Materials/` 27.4 MB、`lab1/` 13.5 MB、`guide/` 0.6 MB，合计约 **61 MB**。最大单文件是 `lab1/assets/robot_articulated.glb`（11.7 MB，其中法线贴图约 6 MB），首屏加载 3–8 秒属正常。

---

## 5. 怎么做实验

1. 先读 `guide/README.md`（5 分钟）：8 学时路线、10 个关口、关键数字速查。
2. 按阶段做，**每关都有可复现的验收判据**：
   - 阶段 0–2：环境 → 原理复习 → 模型导入 → `guide/03_阶段0-2_环境与素材.md`
   - 阶段 3–5：关节表 / 驱动 / 示教器 / FK 验证 → `guide/04_阶段3-5_关节驱动与FK验证.md`
   - 阶段 6–9：标定 / MOVJ / 轨迹 / 可达区域 → `guide/05_阶段6-9_四项任务.md`
   - 交付：`guide/06_验收清单与报告模板.md`（提交物结构、报告模板、评分细则）
3. 工程里只需完成 `lab1/src/` 的 5 个 `TODO(STEP 3–7)`；环境、主循环、模型加载已经给好。
4. 报告放 `lab1/report/`（正文 + `data/` + `figures/` + 演示动画）。

> `guide/02_Games101笔记对应.md` 是作者个人课程笔记（Obsidian，工作区之外）的对照表；队友没有该笔记库可整篇跳过，不影响做实验。
> `guide/` 中提到的 `.agent-work/` 是助教本机的审计脚本目录（已 gitignore），其中的数值结论已写入文档，队友无需复跑。

---

## 6. 常见问题

| 现象 | 原因 / 解决 |
|---|---|
| `'node' 不是内部或外部命令` | Node 没装或没进 PATH：重装 LTS、重开终端；`where node` 确认 |
| `Error: listen EADDRINUSE :::8080` | 端口被占用：换端口（见 2.5），或结束占用进程 |
| 页面**全黑**，Console 报 `Error creating WebGL context` | 浏览器禁用了硬件加速：Chrome/Edge 设置里开启「使用图形加速」，更新显卡驱动；远程桌面/虚拟机可能无 GPU |
| 双击 `index.html` 打开，模型出不来 | 必须 `http://localhost`（同源策略），见 §1 的警告 |
| 控制台 `404 ... robot_articulated.glb` | 没在 `lab1/` 目录下启动服务，或 `assets/` 被移动；确认在 `lab1/` 中执行 `node server.js` |
| 首屏空白好几秒 | 11.7 MB GLB 正在加载；看 Network 面板进度，属正常 |
| 模型巨大 / 悬空 / 看不见 | 检查 `lab1/src/config.js` 的 `modelScale`（应为 `0.1`）；相机被旧缓存影响时 Ctrl+F5 强刷 |
| 中文或空格路径 | `server.js` 用 `__dirname` 解析，理论上没问题；若异常，把仓库放到纯英文路径再试 |
| 根目录 `.lnk` 打不开 / 目标不存在 | 正常，那是作者本机的 Obsidian 笔记快捷方式，已 gitignore，与实验无关 |
| Excel 打开 CSV 中文乱码 | 以「UTF-8」编码导入；或先导出为 UTF-8 BOM |
| macOS / Linux 上路径不对 | `lab1/server.js` 本身跨平台；文档中 `\` 风格路径以仓库根为基准理解即可 |
| 想不起 Three.js 基础 API | 先读 `lab1/src/main.js`（200 行、注释齐全），再对照 `lab1/README.md` |

---

## 7. 协作约定（Git）

- **不要直接在 `main` 上改**：`git checkout -b feat/lab1-fk` → 完成后 PR/合并。
- 提交前自检：
  ```bash
  cd lab1 && node server.js   # 能起来、Console 无红色报错
  ```
- **不要提交**：`node_modules/`、`.agent-work/`、`*.lnk`、`~$*.pptx`、浏览器缓存、录屏原始大文件——`.gitignore` 已覆盖，别用 `git add -f` 强行加。
- 大文件：GLB（11.7 MB）与素材压缩包（13.9 MB）已经在库里，克隆慢属正常；**当前不需要 Git LFS**。若以后素材继续变大，再考虑 LFS。
- 冲突高发区是 `lab1/src/`：多人同时改同一文件时，`git pull --rebase` 后再改；建议按文件分工（如 `robot.js` / `analysis.js` 分人）。
- 报告与数据（`lab1/report/`）**应当提交**：它是交付物的一部分（演示动画若超过 20 MB，可只提交压缩版并在报告里说明原始文件位置）。
- Windows 换行提示：建议 `git config --global core.autocrlf true`，避免 `.js` / `.md` 出现整文件 CRLF 差异。

### 7.1 维护者：首次建库与推送（一次性）

```bash
cd GraphicExperiment
git init
git add -A                      # .gitignore 会排除快捷方式、node_modules、.agent-work、Office 锁文件
git commit -m "init: 实验一讲义/素材/指导包/工程骨架"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

队友随后按 §1 克隆即可。若仓库托管在 GitHub 且提示文件过大（本仓库约 61 MB），优先删除 `Materials/Mesh/模型1.zip`（13.9 MB，与解压后的 `images/` 重复）再推，或改用 Git LFS。

---

## 8. 版本与致谢

- **验证环境**：Windows 11 · Node.js v24.13.0 · Edge/Chromium（WebGL 2.0 / SwiftShader 亦可）。
- **three.js**：0.186 构建（dev 版会打印 `r187dev`），本地化于 `lab1/vendor/three/`，MIT License。
- **模型素材**：Han's Robot 五轴协作臂加工模型（`robot_articulated.glb` 等），仅供本课程实验使用，请勿外传。
- **讲义**：`docs/` 内 PPT 归课程所有。
- **指导包与工程骨架**：由 AI 助教根据讲义与素材实测生成；数值均可在 `guide/01_素材核验报告.md` 中溯源。

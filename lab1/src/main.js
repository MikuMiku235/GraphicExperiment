// 实验一 · 机械臂仿真（一）主程序
//
// 运行：  node server.js    →  浏览器打开 http://localhost:8080
// 结构：  ① 场景三件套 → ② 加载模型（已给）→ ③ 建关节表 → ④ 驱动 → ⑤ 读位姿 → ⑥ 面板
// 你要完成的是 robot.js / ui.js / analysis.js 里标了 TODO 的 5 个 STEP。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';
import { loadRobotModel, loadJointMap, buildJointTable, setJoint, readTCPPose } from './robot.js';
import { bindTeachPendant } from './ui.js';

const $ = (id) => document.getElementById(id);

function setStatus(text, kind = 'ok') {
  const el = $('status');
  el.textContent = text;
  el.className = kind === 'ok' ? '' : kind;
}

// ---------- 全局状态：整个程序唯一的事实源 ----------
const state = {
  robot: null,      // GLB 场景根节点
  tcp: null,        // 'tcp' 节点
  joints: [],       // 关节表（STEP 3 的产物）
  enabled: true,    // 使能
  speed: 100,       // 速度倍率（%）
  estop: false,     // 急停
  gui: null,
};
// 调试小技巧：按 F12 打开 Console，输入 __LAB__ 就能在运行时检查关节表/状态
// （例如 __LAB__.joints.map(j => j.name)），比 console.log 每次改代码更快。
window.__LAB__ = state;

// ---------- ① 渲染器 / 场景 / 相机 / 灯光（已给） ----------
const viewport = $('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
// 阴影不是本实验考核点，但能明显改善"模型是否落地"的判读，建议保留
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f141b);

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  viewport.clientWidth / viewport.clientHeight,
  CONFIG.camera.near,
  CONFIG.camera.far,
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// 灯：环境 + 主光（带阴影）+ 补光，足以看清白色机身上的筋线
scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x1a2230, 1.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(2.5, 4, 2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 12;
keyLight.shadow.camera.left = -2;
keyLight.shadow.camera.right = 2;
keyLight.shadow.camera.top = 2;
keyLight.shadow.camera.bottom = -2;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffd9a8, 0.8);
fillLight.position.set(-3, 2, -2.5);
scene.add(fillLight);

// 地面：GridHelper 只是线，看不出阴影；再叠一张透明地面用于接收阴影
const grid = new THREE.GridHelper(4, 20, 0x3b4a5d, 0x1f2833);
scene.add(grid);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.ShadowMaterial({ opacity: 0.25 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
scene.add(new THREE.AxesHelper(0.3));   // 世界坐标轴：红 X / 绿 Y / 蓝 Z

// ---------- 相机取景：按模型包围盒自动摆位（已给） ----------
function frameCamera(box) {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const dist = Math.max(size.x, size.y, size.z) * 2.1;
  camera.position.set(center.x + dist * 0.72, center.y + dist * 0.30, center.z + dist * 1.05);
  controls.target.copy(center);
  controls.update();
  // 主光随模型居中，保证阴影落在模型脚下
  keyLight.target.position.copy(center);
  scene.add(keyLight.target);
}

// ---------- ①.5 关节轴可视化（?debug=1 时显示，调试"轴错方向"用） ----------
function showJointAxes() {
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const len = 0.12;
  for (const j of state.joints) {
    j.node.getWorldQuaternion(q);
    j.node.getWorldPosition(p);
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
    scene.add(new THREE.ArrowHelper(dir, p, len, 0xff5f56, len * 0.25, len * 0.15));
    scene.add(new THREE.ArrowHelper(dir.clone().negate(), p, len, 0xff5f56, len * 0.25, len * 0.15));
  }
}

// ---------- ⑤ 遥测：每帧读位姿（显示层已给，取数逻辑在 robot.js 的 TODO） ----------
const tmp = { p: new THREE.Vector3() };
function updateTelemetry() {
  if (!state.tcp) return;
  const pose = readTCPPose(state.tcp);
  if (!pose) {
    // STEP 5 没做完时界面显示 "—"，程序不崩
    for (const id of ['pos-x', 'pos-y', 'pos-z', 'rpy-r', 'rpy-p', 'rpy-y', 'quat']) $(id).textContent = '—';
    return;
  }
  $('pos-x').textContent = pose.position.x.toFixed(4);
  $('pos-y').textContent = pose.position.y.toFixed(4);
  $('pos-z').textContent = pose.position.z.toFixed(4);
  const R2D = 180 / Math.PI;
  $('rpy-r').textContent = (pose.rpy.r * R2D).toFixed(2) + '°';
  $('rpy-p').textContent = (pose.rpy.p * R2D).toFixed(2) + '°';
  $('rpy-y').textContent = (pose.rpy.y * R2D).toFixed(2) + '°';
  $('quat').textContent = [pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w]
    .map((v) => v.toFixed(3)).join(', ');
}

// ---------- 主循环（已给） ----------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateTelemetry();
  renderer.render(scene, camera);
}

// ---------- 窗口自适应（已给） ----------
window.addEventListener('resize', () => {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ---------- 急停按钮（已给） ----------
$('estop').addEventListener('click', () => {
  state.estop = !state.estop;
  $('estop').classList.toggle('on', state.estop);
  setStatus(state.estop
    ? '⚠ 急停生效：所有运动指令被拒绝，点动/程序都不会执行'
    : '急停已解除', state.estop ? 'bad' : 'ok');
});

// ---------- 启动流程（已给，STEP 3 的调用在这里） ----------
async function boot() {
  setStatus('加载模型 robot_articulated.glb …');
  const { scene: robot, box, size } = await loadRobotModel();
  robot.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(robot);
  state.robot = robot;

  // 单位自检：打印包围盒，学生要能读懂这三个数
  console.log('[阶段二] 模型包围盒 size(m) =',
    size.x.toFixed(4), size.y.toFixed(4), size.z.toFixed(4));
  console.log('[阶段二] 期望约 (0.69, 1.35, 0.95) m；若差 10 倍/100 倍，回去检查 CONFIG.modelScale');

  frameCamera(box);

  setStatus('读取 joint_map.json …');
  const jointMap = await loadJointMap();

  // ===== STEP 3 =====
  state.joints = buildJointTable(robot, jointMap);
  state.tcp = robot.getObjectByName('tcp');
  if (!state.tcp) throw new Error("场景树里找不到 'tcp' 节点");
  state.robot.updateMatrixWorld(true);

  if (new URLSearchParams(location.search).get('debug') === '1') showJointAxes();

  state.gui = bindTeachPendant(state);

  const ready = state.joints.length === 5;
  setStatus(
    `模型已加载：${state.joints.length} 个关节 · 节点总数 ${countNodes(robot)}\n` +
    `tcp 节点：${state.tcp.name} · 包围盒（米）` +
    `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}\n` +
    (ready ? '就绪：拖动右侧关节滑块观察运动' : '⚠ 关节表为空：请完成 STEP 3（robot.js）'),
    ready ? 'ok' : 'warn',
  );
}

function countNodes(root) {
  let n = 0;
  root.traverse(() => n++);
  return n;
}

animate();
boot().catch((err) => {
  console.error(err);
  setStatus('启动失败：' + err.message + '\n（按 F12 看 Console 完整堆栈）', 'bad');
});

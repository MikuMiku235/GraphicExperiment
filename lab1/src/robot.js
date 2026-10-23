// 模型加载 + 关节表 + 关节驱动 + 末端位姿读取
//
// 这是实验一的核心文件：把"场景树"变成"可驱动的运动链"。
// 参考讲义第 18~21 页（robotLoader / 关节驱动 / 末端位姿）。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

/**
 * 加载 GLB 模型（STEP 2 已实现，读一遍理解它做了什么）
 * @returns {Promise<{scene: THREE.Group, box: THREE.Box3, size: THREE.Vector3, center: THREE.Vector3}>}
 */
export async function loadRobotModel() {
  const gltf = await new GLTFLoader().loadAsync(CONFIG.modelUrl);
  const scene = gltf.scene;
  scene.name = 'robot';
  scene.scale.setScalar(CONFIG.modelScale);
  scene.updateMatrixWorld(true);

  // 包围盒是查单位/朝向错误的第一现场（讲义第 31 页"常见错误 2"）
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { scene, box, size, center };
}

/** 读取 joint_map.json（关卡数据：限位、约定），失败时抛错而不是"带病运行" */
export async function loadJointMap() {
  const res = await fetch(CONFIG.jointMapUrl);
  if (!res.ok) throw new Error(`joint_map.json 加载失败: HTTP ${res.status}`);
  return res.json();
}

/**
 * TODO(STEP 3)：从场景树建出关节表 —— 实验要求 3）
 *
 * 目标：返回 5 个关节对象组成的数组，顺序必须是 J1..J5：
 *   { name, node, axis, lower, upper, angle, qZero }
 *
 * 实现提示（详见指导手册「阶段三 · 建关节表」）：
 *   1. 遍历 CONFIG.jointNames，用 robot.getObjectByName(name) 取到关节节点；
 *      取不到说明名字/大小写/模型路径有问题，直接 throw。
 *      注意：本素材的 GLB 里**没有任何 extras/userData**，讲义 P18 那段
 *      node.userData.joint === true 的写法在这里会静默拿到 0 个关节；
 *      只能按节点名字找。
 *   2. node 上保存的是"零位"（rest pose）的局部四元数，先克隆一份：
 *        qZero = node.quaternion.clone()
 *      后面驱动关节时永远在 qZero 的基础上叠加，不能覆盖它。
 *   3. axis：关节角 = 绕节点**局部 +Y**（右手定则）转动，所以局部轴就是：
 *        new THREE.Vector3(0, 1, 0)
 *      ★ 这是本实验第一个"坐标系陷阱"：素材来自 Blender（Z-up），joint_map.json
 *        说"绕局部 +Z"是 Blender 的说法；经 glTF 的 Y-up 重标定后，
 *        Blender 的局部 +Z 在 GLB/Three.js 里变成局部 +Y。
 *        用 +Z 去转，五个关节会整体差 90°（J5 卷绕还会让 TCP 跑偏）。
 *        验收判据：J5 转到任意角度，TCP 位置必须**不变**。
 *   4. 限位：从 jointMap.joints 里按 name 找到 limit.lower / limit.upper（单位：度）。
 *      存成弧度更方便与 node.quaternion 运算：THREE.MathUtils.degToRad(...)。
 *      注意 joint_map 里还有旧模型残留字段（tcp.offset_local、motion_axis），
 *      限位以 limit 字段为准；J1 ±180、J2~J4 ±120、J5 ±180。
 *   5. angle 初始为 0。
 *   6. 建完做一次"对拍"：数量必须是 5、顺序必须是 J1..J5；否则 throw
 *      （讲义第 18 页的 validateAgainstMap 就是这个作用）。
 *
 * @param {THREE.Object3D} robot
 * @param {object} jointMap  joint_map.json 的内容
 * @returns {Array<object>}
 */
export function buildJointTable(robot, jointMap) {
  // TODO: 在这里实现
  console.warn('[STEP 3 未完成] buildJointTable() 还是空的 —— 关节滑块不会有反应');
  return [];
}

/**
 * TODO(STEP 4)：驱动一个关节 —— 实验要求 3）/ 4）
 *
 * 数学：关节节点的总旋转 R = R_fix · Ry(θ)
 *   - R_fix 就是零位四元数 qZero（素材设计：J_i 的静止旋转 = R_fix）
 *   - q = qZero · Ry(θ)  —— 注意是"右乘"，代表绕自身局部 +Y 转
 * 对应 Three.js：
 *   const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), theta);
 *   joint.node.quaternion.copy(joint.qZero).multiply(qy);
 *
 * 为什么是右乘？右乘 = 在"已经转过 R_fix 的局部坐标系"里转，
 * 即 R = R_fix · Ry；左乘则变成绕世界 Y 轴转，五个关节都会错。
 *
 * 另外两件事：
 *   1. 先钳制再驱动：θ = clamp(θ, joint.lower, joint.upper)（讲义第 19 页）
 *   2. 把钳制后的值写回 joint.angle，供界面显示/轨迹记录使用
 *
 * 常见坑：写成 node.setRotationFromAxisAngle(axis, θ) 会把 qZero 覆盖掉，
 *        关节会"跳"回一个奇怪的姿态（讲义第 24 页的示例代码在这里不适用）。
 *
 * @param {object} joint   关节表里的一项
 * @param {number} angleRad 目标关节角（弧度）
 */
export function setJoint(joint, angleRad) {
  // TODO: 在这里实现
  console.warn('[STEP 4 未完成] setJoint() 还是空的 —— 关节不会动');
}

/**
 * TODO(STEP 5)：读取末端 TCP 的世界位姿 —— 实验要求 2）/ 5）
 *
 * 提示：Three.js 渲染前会沿场景树算好 matrixWorld，所以直接读世界位姿即可：
 *   const p = new THREE.Vector3();      tcp.getWorldPosition(p);
 *   const q = new THREE.Quaternion();   tcp.getWorldQuaternion(q);
 *   const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');  // RPY，弧度为内部单位
 * 返回：
 *   { position: {x,y,z}(米), quaternion: {x,y,z,w}, rpy: {r,p,y}(弧度) }
 *
 * @param {THREE.Object3D} tcp  名为 'tcp' 的节点
 * @returns {{position:object, quaternion:object, rpy:object}|null}
 */
export function readTCPPose(tcp) {
  // TODO: 在这里实现
  return null;
}

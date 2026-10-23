// 虚拟示教器面板：关节滑块 / 使能 / 速度倍率
// 参考讲义第 20 页「本实验示教器功能清单」与第 25 页 lil-gui 示例。
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { setJoint } from './robot.js';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

/**
 * 把 state 绑到 lil-gui 面板上。
 * @param {object} state { joints, enabled, speed, estop }
 * @returns {GUI}
 */
export function bindTeachPendant(state) {
  const gui = new GUI({
    title: '示教器 · 控制',
    container: document.getElementById('gui-slot'),   // 嵌进右侧面板，而不是浮在页面右上角
    width: 238,
  });
  // 隐藏 lil-gui 自带的标题栏（面板卡片上已经有标题，避免重复）
  const guiTitle = gui.domElement.querySelector('.title');
  if (guiTitle) guiTitle.style.display = 'none';

  // ---- ① 安全与速度（已给出，读懂即可）----
  const safe = gui.addFolder('安全 / 速度');
  safe.add(state, 'enabled').name('使能').onChange((on) => {
    // 失能时把滑块全部禁用：真机上使能开关松手 = 断电，关节立刻抱闸
    for (const c of jointControllers) c.disable(!on);
  });
  safe.add(state, 'speed', 10, 100, 1).name('速度倍率 (%)');

  // ---- ② 关节滑块（TODO STEP 6）----
  const jointFolder = gui.addFolder('关节 (deg)');
  const jointControllers = [];
  state.jointControllers = jointControllers;

  if (state.joints.length === 0) {
    jointFolder.add({ tip: '关节表为空' }, 'tip').name('先完成 STEP 3').disable();
  }

  // TODO(STEP 6)：为每个关节建一个滑块
  //   对 state.joints 里的每个 joint 做：
  //     const proxy = { value: THREE.MathUtils.radToDeg(joint.angle) };
  //     const ctrl = jointFolder
  //         .add(proxy, 'value', lowerDeg, upperDeg, 0.1)
  //         .name(joint.name + ' (°)')
  //         .onChange((v) => {
  //             if (state.estop) { proxy.value = THREE.MathUtils.radToDeg(joint.angle); return; } // 急停：拒绝新指令
  //             setJoint(joint, v * DEG2RAD);
  //         });
  //     jointControllers.push(ctrl);
  //   注意：范围要用 joint.lower / joint.upper 换算成"度"，不要写死 ±180。
  //   其余关节的要求见指导手册「阶段四 · 示教器」。

  gui.domElement.style.marginTop = '8px';
  return gui;
}

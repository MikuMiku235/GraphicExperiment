// 全局配置：只放"常量"，不放逻辑
export const CONFIG = {
  modelUrl: './assets/robot_articulated.glb',
  jointMapUrl: './assets/joint_map.json',

  // 素材单位 → 米。GLB 里模型总高约 13.5 个单位，真实 Han's Robot 5 轴臂高约 1.35 m，
  // 所以缩放 0.1。这个系数必须自己验证：加载后打印 boundingBox，期望尺寸约
  // (0.69 m, 1.35 m, 0.95 m) —— 详见指导手册「阶段二 · 素材与单位」。
  modelScale: 0.1,

  camera: { fov: 42, near: 0.01, far: 100 },

  // GLB 场景树里的关节节点名（严格按大小写）
  jointNames: ['J1', 'J2', 'J3', 'J4', 'J5'],
};

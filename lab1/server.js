// 零依赖静态服务器：node server.js
// 为什么不能双击打开 index.html？—— ES Module 与模型文件受浏览器同源策略限制，
// file:// 协议下会被拦截；必须通过 http://localhost 访问（讲义第 14 页）。
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.urdf': 'application/xml; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(ROOT, urlPath === '/' ? '/index.html' : urlPath);
  // 只允许访问站点根目录内，避免 ../../ 越权
  if (!filePath.startsWith(path.resolve(ROOT))) {
    res.writeHead(403).end('403 forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 not found: ' + urlPath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n  实验一 · 机械臂仿真（一）\n  本地服务已启动: http://localhost:${PORT}\n  停止: Ctrl+C\n`);
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`端口 ${PORT} 已被占用：换端口运行 PORT=8081 node server.js`);
  else throw e;
});

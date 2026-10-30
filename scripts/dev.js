import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isWin = process.platform === 'win32';
let phpBin = 'php';
if (isWin && fs.existsSync('C:\\xampp\\php\\php.exe')) {
  phpBin = 'C:\\xampp\\php\\php.exe';
}

console.log('🚀 Memulai PEPSO PARTS Development Servers...\n');

// 1. Jalankan PHP Built-in Server
const phpServer = spawn(phpBin, ['-S', '127.0.0.1:8000', '-t', 'backend/public', 'backend/public/router.php'], {
  stdio: 'inherit',
  shell: true,
});

phpServer.on('error', (err) => {
  console.error('❌ Gagal menjalankan server PHP:', err.message);
});

console.log('🐘 PHP Server berjalan di: http://127.0.0.1:8000');

// 2. Jalankan Vite Frontend
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const viteServer = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve('frontend'),
  stdio: 'inherit',
  shell: true,
});

viteServer.on('error', (err) => {
  console.error('❌ Gagal menjalankan Vite server:', err.message);
});

function cleanup() {
  console.log('\n🛑 Menghentikan seluruh development servers...');
  try {
    if (isWin) {
      if (phpServer.pid) spawn('taskkill', ['/pid', String(phpServer.pid), '/f', '/t']);
      if (viteServer.pid) spawn('taskkill', ['/pid', String(viteServer.pid), '/f', '/t']);
    } else {
      phpServer.kill();
      viteServer.kill();
    }
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);


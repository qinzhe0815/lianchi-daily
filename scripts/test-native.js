const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
if (process.platform !== 'darwin') { console.error('Swift 原生存储测试需要 macOS'); process.exit(1); }
process.chdir(path.resolve(__dirname, '..'));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lianchi-native-test-'));
try {
  const exe = path.join(dir, 'store-tests');
  cp.execFileSync('swiftc', ['-module-cache-path', path.join(dir, 'modules'), 'ios/App/App/DurableStore.swift', 'test/native-store.swift', '-o', exe], { stdio: 'inherit' });
  cp.execFileSync(exe, { stdio: 'inherit' });
} finally { fs.rmSync(dir, { recursive: true, force: true }); }

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
(async () => {
  for (const platform of ['ios', 'web']) {
    let network = 0, registered = 0, notices = 0;
    const ctx = { window: null, Platform: { supportsApk: () => false, isIOS: () => platform === 'ios' },
      C: { APP_VERSION: '1.6.0', LS: { get: () => null }, toast: () => notices++ },
      fetch: () => network++, setTimeout: () => network++, capacitorExports: { registerPlugin: () => registered++ } };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync('www/js/updater.js', 'utf8'), ctx);
    ctx.Updater.autoCheck(); await ctx.Updater.check(true); await ctx.Updater.check(false);
    assert.equal(network, 0); assert.equal(registered, 0); assert.equal(notices, 1);
  }
  console.log('更新：iOS/网页不请求 APK、不注册安卓安装器通过');
})().catch(e => { console.error(e); process.exitCode = 1; });

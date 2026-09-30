const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load(native, disk, old = {}) {
  const local = new Map(Object.entries(old)); let fail = false;
  const plugin = { load: async () => ({ data: { ...disk.data } }), save: async ({ data }) => { if (fail) throw new Error('disk full'); disk.data = { ...data }; }, clear: async () => { disk.data = {}; } };
  const ctx = { window: null, Platform: { isIOS: () => native, plugin: () => plugin }, localStorage: { get length() { return local.size; }, key: i => [...local.keys()][i], getItem: k => local.get(k) ?? null, setItem: (k, v) => local.set(k, v), removeItem: k => local.delete(k) }, dispatchEvent() {}, CustomEvent: class {}, setTimeout, clearTimeout };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync('www/js/storage.js', 'utf8'), ctx);
  return { s: ctx.AppStorage, local, fail: v => { fail = v; } };
}
(async () => {
  const disk = { data: {} }, old = { 'lcd:profile': '{"weight":80}', 'lcd:ai': '{"key":"secret","base":"https://example.org"}', unrelated: 'keep' };
  const first = load(true, disk, old); await first.s.init();
  assert.equal(first.s.get('profile').weight, 80); assert.equal(first.s.get('ai').key, 'secret');
  assert.equal(first.local.has('lcd:ai'), false, '成功迁移后清除 WebView 里的 Key');
  first.s.set('m:2026-09', { '2026-09-29': { weight: 79 } });
  first.s.set('profile', { weight: 79 }); await first.s.flush();
  const reboot = load(true, disk); await reboot.s.init(); assert.equal(reboot.s.get('profile').weight, 79);
  assert.equal(reboot.s.get('m:2026-09')['2026-09-29'].weight, 79);
  assert.equal(reboot.s.all()['lcd:ai'], old['lcd:ai']);
  reboot.s.importRaw({ 'lcd:profile': '{"weight":75}' }); await reboot.s.flush();
  assert.equal(load(false, disk, disk.data).s.get('profile').weight, 75);
  reboot.fail(true); reboot.s.set('profile', { weight: 74 }); await assert.rejects(reboot.s.flush());
  reboot.fail(false); await reboot.s.flush(); assert.equal(JSON.parse(disk.data['lcd:profile']).weight, 74, '失败后 flush 可重试');
  await reboot.s.clear(); assert.equal(Object.keys(disk.data).length, 0);
  const broken = load(true, { data: {} }, old); broken.fail(true); await assert.rejects(broken.s.init());
  assert.equal(broken.local.get('lcd:ai'), old['lcd:ai'], '失败迁移保留旧备份');
  const web = load(false, { data: {} }, old); await web.s.init(); web.s.set('look', { mode: 'dark' }); assert.equal(JSON.parse(web.local.get('lcd:look')).mode, 'dark');
  assert.throws(() => web.s.importRaw({ 'lcd:bad': '{' }), /JSON/);
  console.log('存储：迁移、重启、写入队列、导入、失败重试和清除通过');
})().catch(e => { console.error(e); process.exitCode = 1; });

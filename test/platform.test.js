const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load(name) {
  const calls = [];
  const ctx = { window: null, Date, URL, Capacitor: { getPlatform: () => name, registerPlugin: () => ({ getPhoto: async o => { calls.push(o); return { dataUrl: 'data:image/jpeg;base64,abc' }; } }) } };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('www/js/platform.js', 'utf8'), ctx);
  return { p: ctx.Platform, calls };
}
(async () => {
  const { p, calls } = load('ios');
  assert.equal(p.isIOS(), true); assert.equal(p.supportsApk(), false);
  assert.equal(load('android').p.supportsApk(), true);
  assert.equal(load('web').p.isNative(), false);
  const notes = Array.from({ length: 90 }, (_, i) => ({ id: i, schedule: { at: new Date(2026, 8, 29, 12, 90 - i) } }));
  const selected = p.selectNotifications(notes);
  assert.equal(selected.length, 64); assert.equal(selected[0].id, 89); assert.equal(selected[63].id, 26);
  assert.equal(notes[0].id, 0, '排序不应修改原数组');
  assert.equal(load('android').p.selectNotifications(notes).length, 90);
  assert.equal(p.notificationDate('2026-09-29', '00:30', '07:30').getDate(), 30);
  assert.equal(p.notificationDate('2026-09-29', '06:50', '07:30').getDate(), 29);
  assert.equal(await p.pickPhoto(true), 'data:image/jpeg;base64,abc');
  assert.equal(calls[0].source, 'CAMERA'); assert.equal(calls[0].saveToGallery, false);
  await p.pickPhoto(false); assert.equal(calls[1].source, 'PHOTOS');
  console.log('平台：iOS/安卓分支、通知上限/排序/日期、照片选择通过');
})().catch(e => { console.error(e); process.exitCode = 1; });

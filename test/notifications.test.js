const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
(async () => {
  let release, started;
  const blocked = new Promise(r => release = r), entered = new Promise(r => started = r);
  let calls = 0, pending = [];
  const nt = { checked: true }, controls = { '#nt-on': nt, '#up-check': {}, '#up-msg': {} };
  const S = { notify: { on: true }, profile: { wake: '07:30' } };
  const ln = {
    checkPermissions: async () => ({ display: 'granted' }),
    getPending: async () => { if (++calls === 1) { started(); await blocked; } return { notifications: pending.slice() }; },
    cancel: async () => { pending = []; },
    schedule: async ({ notifications }) => { pending = notifications; }
  };
  const ctx = { Date, Promise, console, CARDIO: [], Capacitor: { isNativePlatform: () => true }, capacitorLocalNotifications: { LocalNotifications: ln }, Kit: { I: {}, haptic() {} }, Platform: { supportsApk: () => false, notificationDate: () => new Date('2099-01-01'), selectNotifications: x => x }, C: { S, LS: { set() {} }, $: x => controls[x], $$: () => [], today: () => '2099-01-01', E: { addDays: () => '2099-01-01' }, tasksFor: () => ({ tasks: [{ id: 'meal', title: '用餐', time: '19:00' }] }), peek: () => ({}), toast() {} } };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync('www/js/ui-me.js', 'utf8'), ctx);
  ctx.Me.bind();
  const scheduling = ctx.Me.scheduleNotifs();
  await entered;
  nt.checked = false;
  const disabling = nt.onchange();
  await new Promise(setImmediate);
  release();
  await Promise.all([scheduling, disabling]);
  assert.equal(pending.length, 0, '关闭提醒必须取消正在排队的通知');
  console.log('通知排队：关闭提醒竞态回归通过');
})().catch(e => { console.error(e); process.exitCode = 1; });

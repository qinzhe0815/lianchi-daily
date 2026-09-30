const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
  const saved = {}; let prompts = 0, allow = true;
  const ctx = { window: null, URL, addEventListener() {}, removeEventListener() {}, C: { esc: s => s,
    LS: { get: k => saved[k], set: (k, v) => { saved[k] = v; }, flush: async () => {} }, close() {},
    sheet: (html, bind) => { prompts++; bind({ querySelector: sel => { const el = {}; queueMicrotask(() => { if (sel === (allow ? '#privacy-yes' : '#privacy-no')) el.onclick(); }); return el; } }); } } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync('www/js/privacy.js', 'utf8'), ctx);
  return { p: ctx.Privacy, prompts: () => prompts, deny: () => { allow = false; } };
}
(async () => {
  const t = setup(), cfg = { base: 'https://example.org/v1', key: 'secret' };
  await assert.rejects(t.p.authorize({ base: 'http://example.org' }, 'food'), /HTTPS/);
  await assert.rejects(t.p.authorize({ base: 'https://user:pass@example.org' }, 'food'), /接口地址/);
  await t.p.authorize(cfg, 'food'); assert.equal(t.prompts(), 1);
  await t.p.authorize(cfg, 'food'); assert.equal(t.prompts(), 1);
  await t.p.authorize(cfg, 'chat'); assert.equal(t.prompts(), 2);
  await t.p.authorize({ ...cfg, base: 'https://other.org/v1' }, 'food'); assert.equal(t.prompts(), 3);
  t.p.revoke(); t.deny(); await assert.rejects(t.p.authorize(cfg, 'food'), /取消/);
  const aborted = { aborted: true }; await assert.rejects(t.p.authorize(cfg, 'chat', aborted), /停止/);
  console.log('隐私：HTTPS、接口隔离、用途隔离、撤销、拒绝和停止通过');
})().catch(e => { console.error(e); process.exitCode = 1; });

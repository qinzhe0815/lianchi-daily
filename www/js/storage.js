/* iOS：原生原子写入 + Keychain；Web/Android：保持 lcd: 备份格式。 */
window.AppStorage = (() => {
  const PREFIX = 'lcd:';
  const native = Platform.isIOS();
  let cache = {}, initialized = false, revision = 0, savedRevision = 0;
  let queue = Promise.resolve(), lastError = null;
  const store = () => Platform.plugin('PersistentStore');
  function localData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (k.startsWith(PREFIX)) data[k] = localStorage.getItem(k);
    }
    return data;
  }
  function report(error) {
    lastError = error;
    window.dispatchEvent(new CustomEvent('storageerror', { detail: error }));
  }
  function persist() {
    if (!native || revision === savedRevision) return queue;
    const data = { ...cache }, rev = revision;
    queue = queue.catch(() => {}).then(async () => {
      await store().save({ data }); savedRevision = rev; lastError = null;
    });
    queue.catch(report);
    return queue;
  }
  async function init() {
    if (initialized) return;
    if (!native) { initialized = true; return; }
    const old = localData();
    const result = await store().load();
    cache = Object.assign({}, old, result.data || {});
    if (Object.keys(old).some(k => !(k in (result.data || {})))) {
      revision++; await persist();
    }
    // 原生保存成功以后才删除旧缓存中的凭据和数据。
    Object.keys(old).forEach(k => localStorage.removeItem(k));
    initialized = true;
  }
  function getRaw(k) { return native ? (cache[k] ?? null) : localStorage.getItem(k); }
  function get(k) { try { const s = getRaw(PREFIX + k); return s == null ? null : JSON.parse(s); } catch (e) { return null; } }
  function set(k, value) {
    const key = PREFIX + k;
    try {
      if (native) {
        if (!initialized) throw new Error('存储尚未初始化');
        if (value == null) delete cache[key]; else cache[key] = JSON.stringify(value);
        revision++; persist();
      } else if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { report(e); throw e; }
  }
  function all() { return native ? { ...cache } : localData(); }
  function importRaw(data) {
    const entries = Object.entries(data).filter(([k]) => k.startsWith(PREFIX));
    entries.forEach(([, v]) => { if (typeof v !== 'string') throw new Error('备份 JSON 值无效'); JSON.parse(v); });
    if (native) { entries.forEach(([k, v]) => cache[k] = v); revision++; persist(); }
    else entries.forEach(([k, v]) => localStorage.setItem(k, v));
  }
  async function flush() { if (native) { await queue.catch(() => {}); if (revision !== savedRevision) await persist(); if (lastError) throw lastError; } }
  async function clear() {
    await queue.catch(() => {});
    if (native) await store().clear();
    Object.keys(localData()).forEach(k => localStorage.removeItem(k));
    cache = {}; revision = savedRevision = 0; lastError = null;
  }
  return { init, get, set, all, importRaw, flush, clear };
})();

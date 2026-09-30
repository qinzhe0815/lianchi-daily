/* 明确到接收接口和用途的 AI 授权；从备份导入的授权不应恢复。 */
window.Privacy = (() => {
  const { LS, esc, sheet, close } = C;
  const VERSION = 1;
  const scopes = {
    models: 'API Key 用于认证并获取可用模型列表，不发送身体资料或照片。',
    food: '发送餐食照片或饮食文字、减脂/增肌目标、这一餐及全天的营养配额与已记录摄入，用于估算食物。',
    analysis: '发送最近记录的摄入、消耗、营养目标与体重汇总，用于分析趋势。',
    chat: '发送对话文字，以及助手按问题读取的身体资料、计划、每日安排和最近记录，用于回答和提出修改。',
    image: '发送你选中的照片和问题文字，用于识别器械、动作或食物。',
  };
  function endpoint(cfg) {
    let url;
    try { url = new URL(String(cfg.base || '').trim()); } catch (e) { throw new Error('接口地址无效，请填写 HTTPS 地址'); }
    if (url.protocol !== 'https:') throw new Error('为了保护资料和 API Key，只支持 HTTPS 接口');
    if (url.username || url.password || url.search || url.hash) throw new Error('接口地址不能包含账号、密码、查询参数或片段');
    return url.origin + url.pathname.replace(/\/+$/, '');
  }
  function revoke() { LS.set('aiConsent', null); }
  async function authorize(cfg, scope, signal) {
    if (signal && signal.aborted) { const e = new Error('已停止'); e.stopped = true; throw e; }
    const base = endpoint(cfg);
    if (!scopes[scope]) throw new Error('未知的数据用途');
    const id = base + '|' + scope;
    const consent = LS.get('aiConsent') || {};
    if (consent[id] === VERSION) return;
    await new Promise((resolve, reject) => {
      let finished = false;
      const finish = ok => {
        if (finished) return; finished = true;
        window.removeEventListener('modalclose', cancelled);
        if (signal) signal.removeEventListener('abort', cancelled);
        close();
        if (ok) resolve(); else { const e = new Error(signal && signal.aborted ? '已停止' : '已取消发送，数据未交给模型服务'); e.stopped = true; reject(e); }
      };
      const cancelled = () => finish(false);
      sheet(`<h2>允许发送给模型服务？</h2><div class="sheet-sub">接收接口：${esc(base)}</div><p class="t-sub">${esc(scopes[scope])}</p>
        <p class="t-foot l2">请求还会携带 API Key 进行认证。接收方由你选择，请确认其隐私政策。拒绝后仍可使用本地计划、记录和打卡。同一接口的此用途只询问一次，可在“隐私与数据”中撤销。</p>
        <button class="pill ink wide" id="privacy-yes">允许此次用途</button><button class="pill glass wide" id="privacy-no">取消</button>`, m => {
        m.querySelector('#privacy-yes').onclick = () => finish(true);
        m.querySelector('#privacy-no').onclick = () => finish(false);
      });
      window.addEventListener('modalclose', cancelled, { once: true });
      if (signal) signal.addEventListener('abort', cancelled, { once: true });
    });
    if (signal && signal.aborted) { const e = new Error('已停止'); e.stopped = true; throw e; }
    LS.set('aiConsent', { ...(LS.get('aiConsent') || {}), [id]: VERSION });
  }
  return { endpoint, authorize, revoke };
})();

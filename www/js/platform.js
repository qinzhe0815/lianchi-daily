/* 原生平台边界。浏览器预览继续使用文件输入和本地存储。 */
window.Platform = (() => {
  const name = () => window.Capacitor && Capacitor.getPlatform ? Capacitor.getPlatform() : 'web';
  const isIOS = () => name() === 'ios';
  const isNative = () => name() === 'ios' || name() === 'android';
  const plugins = {};
  function plugin(id) {
    if (!isNative()) return null;
    if (!plugins[id]) plugins[id] = Capacitor.registerPlugin(id);
    return plugins[id];
  }
  function notificationDate(day, time, wake) {
    const [y, m, d] = day.split('-').map(Number), [h, min] = time.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    const at = new Date(y, m - 1, d, h, min);
    if (h * 60 + min < wh * 60 + wm - 60) at.setDate(at.getDate() + 1);
    return at;
  }
  function selectNotifications(list) {
    const sorted = list.slice().sort((a, b) => a.schedule.at - b.schedule.at || a.id - b.id);
    return isIOS() ? sorted.slice(0, 64) : sorted;
  }
  async function pickPhoto(camera) {
    if (!isNative()) return null;
    try {
      const result = await plugin('Camera').getPhoto({ quality: 80, width: 1024, height: 1024,
        resultType: 'dataUrl', source: camera ? 'CAMERA' : 'PHOTOS', direction: 'REAR',
        saveToGallery: false, correctOrientation: true });
      if (!result.dataUrl) throw new Error('照片没有成功读取');
      return result.dataUrl;
    } catch (e) {
      if (/cancel|取消/i.test(e.message || '')) return null;
      throw e;
    }
  }
  return { name, isIOS, isNative, supportsApk: () => name() === 'android', plugin, notificationDate, selectNotifications, pickPhoto };
})();

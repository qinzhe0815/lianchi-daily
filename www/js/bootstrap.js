/* 先恢复原生数据，再执行依赖这些数据的外观、页面和入口。 */
(async () => {
  const scripts = ['look', 'data-tables', 'data-rules', 'data-training', 'holidays', 'engine', 'ai', 'ui-kit', 'core',
    'privacy', 'updater', 'assistant', 'ui-today', 'ui-train', 'ui-food', 'ui-data', 'ui-me', 'ui-guide', 'main'];
  try {
    await AppStorage.init();
    for (const name of scripts) await new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = `js/${name}.js`;
      script.onload = resolve; script.onerror = () => reject(new Error('页面资源加载失败')); document.head.appendChild(script);
    });
  } catch (e) {
    const app = document.getElementById('app'); app.textContent = '';
    const message = document.createElement('p'); message.textContent = '无法恢复数据或加载应用，请重试。原有记录未被清除。';
    const button = document.createElement('button'); button.className = 'pill ink'; button.textContent = '重试'; button.onclick = () => location.reload();
    app.append(message, button);
  }
})();

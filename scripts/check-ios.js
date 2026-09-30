/* 无需 Xcode 的工程检查；不是编译或真机验证的替代品。 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const read = name => fs.readFileSync(name, 'utf8');
const root = path.resolve(__dirname, '..'); process.chdir(root);
const pkg = JSON.parse(read('package.json'));
const project = read('ios/App/App.xcodeproj/project.pbxproj');
assert(pkg.dependencies['@capacitor/ios'], '缺少 iOS 依赖');
for (const name of ['DurableStore.swift', 'PersistentStorePlugin.swift', 'LianchiViewController.swift']) {
  assert(project.includes(`${name} in Sources`), `${name} 未进入编译阶段`); assert(fs.existsSync(`ios/App/App/${name}`));
}
assert(project.includes('PrivacyInfo.xcprivacy in Resources'), '隐私清单未进入资源阶段');
assert(project.includes(`MARKETING_VERSION = ${pkg.version};`), 'iOS 版本号与 package.json 不符');
assert(read('ios/App/App/SceneDelegate.swift').includes('LianchiViewController()'), 'Scene 启动未注册本地插件');
assert(read('ios/App/App/Base.lproj/Main.storyboard').includes('customClass="LianchiViewController"'), 'Storyboard 未注册本地插件');
const plist = read('ios/App/App/Info.plist');
for (const key of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription']) assert(plist.includes(key), `缺少 ${key}`);
assert(!plist.includes('NSAllowsArbitraryLoads'), '不能放宽 HTTPS 传输限制');
const assets = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/';
for (const image of JSON.parse(read(assets + 'Contents.json')).images) assert(fs.existsSync(assets + image.filename));
const bootstrap = read('www/js/bootstrap.js');
for (const name of ['platform', 'storage', 'bootstrap']) assert(read('www/index.html').includes(`js/${name}.js`));
for (const name of bootstrap.match(/const scripts = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)) assert(fs.existsSync(`www/js/${name[1]}.js`));
for (const file of fs.readdirSync('www/js').filter(f => f.endsWith('.js'))) cp.execFileSync(process.execPath, ['--check', 'www/js/' + file]);
if (process.platform === 'darwin') cp.execFileSync('plutil', ['-lint', 'ios/App/App/Info.plist', 'ios/App/App/PrivacyInfo.xcprivacy', 'ios/App/App.xcodeproj/project.pbxproj'], { stdio: 'inherit' });
console.log('iOS 工程资源、启动注册、权限、版本和 JavaScript 语法检查通过');

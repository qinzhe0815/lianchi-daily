# 练吃日课 iOS 版

此分支提供 Capacitor 8 原生 iOS 工程，支持 iPhone / iPad、iOS 15 起。五个页面、套表算法、动作与拉伸图、饮食记录、AI 助手、备份和本地提醒共享同一套业务代码。原生层使用 Swift，负责 Keychain 和原子文件存储。

## 当前验证边界

本机已运行算法、平台、隐私、存储测试，以及 Swift 原生存储测试和工程静态检查。浏览器验证覆盖新手引导、五个页面和手动饮食保存。

当前开发机没有完整 Xcode，因此尚未完成 iOS 模拟器编译、签名安装或 iPhone 真机验证。不能将浏览器测试等同于 WKWebView 真机测试。仓库的 `iOS validation` 工作流会在 macOS 26 上运行模拟器构建；工作流需推送后才会实际执行。

## 安装到自己的 iPhone（不需要上架）

1. 在 Mac 安装完整 Xcode 26 或更新版本，打开一次完成组件安装。Xcode → Settings → Accounts 登录自己的 Apple 账号。
2. 在项目目录执行：

   ```bash
   npm ci
   npm test
   npm run test:native
   npm run sync:ios
   npm run check:ios
   npm run open:ios
   ```

3. Xcode 打开 `ios/App/App.xcodeproj`，选中 **App** target → **Signing & Capabilities** → 选择自己的 **Team**，保留 Automatically manage signing。
4. 默认 Bundle ID 是 `com.abigcyan.lianchi`。如果此标识不属于你的团队，可改为你自己的唯一标识，同时修改 `capacitor.config.json` 的 `appId`，再运行 `npm run sync:ios`。以后保持同一标识和签名团队，避免形成另一个 App 和存储空间。
5. 连接并信任 iPhone；按系统提示开启 Developer Mode。Xcode 顶部选自己的 iPhone，再点 Run。
6. 免费 Personal Team 可用于自用测试，签名通常 7 天到期，届时重新用 Xcode 安装；使用付费开发者账号可选择开发/Ad Hoc 分发。覆盖安装前建议导出备份，不要先卸载旧 App。

## 模拟器构建

```bash
npm run sync:ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath DerivedData CODE_SIGNING_ALLOWED=NO build
```

CI 上传的是模拟器 `.app`，不能直接装到 iPhone。真机安装包需要你的证书、描述文件和签名；仓库不包含证书、API Key 或付费账号。

## iOS 与安卓的区别

| 能力 | iOS 行为 |
|---|---|
| 资料和记录 | Application Support 下的原子 JSON 快照，启动前恢复；兼容原来的 `lcd:` 备份格式 |
| API Key | Keychain，ThisDeviceOnly，不出现在原生快照文件中；导出时明确勾选才能带出 |
| 旧记录 | 本机旧 WebView `localStorage` 自动迁移，原生写入成功后才移除旧缓存 |
| 安卓迁移 | 安卓导出 JSON，用 iOS“导入数据”选文件或粘贴；两个系统不自动同步 |
| 通知 | 按时间排序安排最近最多 64 条，前台补排，点击跳转到对应日期；不依赖服务器 |
| 拍照与选图 | Capacitor Camera，选取前由系统处理权限，压缩到 1024px，不自动保存到相册 |
| 文件备份 | 原生 Filesystem + iOS 分享面板，可保存到“文件”；导入等待持久化成功再重载 |
| 震动 | Capacitor Haptics；不支持的设备无触感不影响操作 |
| 更新 | 不执行 GitHub APK 检查和安装；通过原来的 Xcode/TestFlight 方式更新 |
| AI | 用户配置 HTTPS 接口，按接收接口与用途取得同意；可撤销授权 |

一次安排的通知数量有限，App 不会在后台常驻运算。若很久不打开，后续未安排的提醒不会自动出现，建议每天打开一次。系统专注模式、通知摘要和权限设置也会影响提示。数据与 API Key 可能在换机时分开恢复；换机缺少 Keychain 凭据时，普通记录仍可读取，需重新配置 Key；设备暂时无法访问 Keychain 时，解锁后重试。

## 发布前真机检查

- 首次安装、跳过 AI、生成计划，重启和强制结束后记录仍保留。
- 五页切换，训练动作替换/组记录、餐次同步、跨午夜时间、滚轮编辑。
- 拒绝相机/照片权限、有限照片选择、取消选择、HEIC 和横拍图片。
- 通知授权开关，完成任务取消提醒，点击通知跳转，超 64 条时只保留近期安排。
- 备份导出到“文件”、从安卓导入、未勾选接口时文件不含 Key。
- AI HTTPS 校验、取消授权不发请求、更换接口重新询问、停止回答不执行后续修改。
- 键盘打开、旋转屏幕、小屏 iPhone、iPad、深色和减少动态效果。
- 网络失败、存储失败重试、清除数据（包括通知和 Keychain）。

## 以后上架的准备

先完成 Xcode 构建和真机检查，再补正式支持联系方式、公开隐私政策网址和截图、套表文字及拉伸图片的授权证明、发行地区所需的备案。按实际 AI 数据流填写 App Store Connect 隐私信息，核对所有 SDK 的隐私清单，不能直接宣称“不收集任何数据”。本分支没有代替这些审核和运营准备，也没有提交 TestFlight 或 App Store。

参考：[Capacitor iOS](https://capacitorjs.com/docs/ios)、[Apple 个人开发账号](https://developer.apple.com/help/account/basics/about-your-developer-account)、[注册设备分发](https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices)。

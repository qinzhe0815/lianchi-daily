# 练吃日课

一个按 **《健身Excel超级套表》（B站好人松松）** 的规则，自动生成减脂/增肌饮食和训练计划，并每天按时间线提醒、打卡、记录的 iOS / Android App。界面设计见 [DESIGN.md](DESIGN.md)。核心功能离线使用；AI 功能会在授权后把必要数据发送给你配置的模型服务，检查更新和更新节假日也需要联网。

算法和每条规则的出处见 [ALGORITHM.md](ALGORITHM.md)。

## 功能

- **按资料生成计划**：判断减脂还是增肌，计算热量、碳水、蛋白质、脂肪，按训练时间选对应的饮食表（表1-15），按经验、次数、地点选分化（表21-24），可以选想练的部位。
- **卡片式设计**：时间线和训练动作都是卡片，默认按规则生成，可以删除、添加、调整，选择只改今天或以后都这样。
- **今天**：摘要卡（完成度、摄入、消耗、缺口）+ 时间线卡片，完成就打勾；称重卡片里直接填体重。
- **训练**：选今天练哪天或自选部位；动作卡片有图片，可以换成原表同一肌群的备选动作、从动作库添加动作、调整组数；逐组记录重量和次数。
- **饮食**：拍照、相册导入、手动添加（表19 食物、自己填、文字让 AI 估），对比每餐和全天目标。
- **数据**：每日摄入与消耗对比、热量缺口分析（可让 AI 分析）、体重趋势、打卡日历、奖章。
- **基础代谢**：默认按公式，也可以手动输入。
- **导入导出**：导出为文件或复制，可选是否包含大模型接口信息。
- **节假日**：自动跳过法定节假日，调休补班日按工作日算。
- **大模型**：接入你自己的接口（通义千问、智谱、豆包、Kimi、OpenAI、Claude 等），自动扫描可用模型；内置按套表规则写的饮食识别提示词。
- **提醒**：安卓本地通知，按时间线提醒未来 7 天。
- **助手**：只按套表回答并标出处，可以查原文、看你的计划和记录，也可以帮你改目标、训练日、部位、动作（每次都要你确认）。
- **新手引导**：第一次打开时填身体信息、训练作息、大模型接口，或直接导入备份；可跳过，可在设置里重新打开。
- **设置**：深浅色、主题色、背景色调、毛玻璃模糊和不透明度、头像。
- **全部安排**：每一项可以改时间、上下移动（不超出前后两项的时间）。
- **应用内更新**：读取本仓库的 GitHub Releases，在 App 里下载并调起系统安装，数据保留。

## 安装

- **iOS**：已有原生 Xcode 工程，可直接安装到自己的 iPhone，无需上架。详细步骤、平台差异和验证边界见 [iOS 安装与开发](docs/IOS.md)。当前机器没有完整 Xcode，尚未完成模拟器编译和真机验证；并无现成签名 IPA。

到 [Releases](https://github.com/ABigCyan/lianchi-daily/releases) 下载：

- **安卓**：`lianchi-daily-x.y.z.apk`，在手机上打开安装（需要允许“安装未知来源应用”）。以后的新版本可以直接覆盖安装。

## 开发

```bash
npm ci
npm test                          # 算法测试（含 22 种资料组合）
npm run test:native               # Swift 原生存储测试（macOS）
npm run sync:ios                  # 同步 iOS 工程（Swift Package Manager）
npm run check:ios                 # iOS 工程与 JS 静态检查
npm run open:ios                  # 用 Xcode 打开工程
python3 tools/build-kb.py 套表.xlsx # 从原表重新生成助手的知识库 www/js/data-kb.js
python3 tools/build-tables.py 套表.xlsx # 从原表重新生成表16、表19 全表和拉伸图
python3 -m http.server 8766 --directory www   # 浏览器里预览
npx cap sync android               # 把 www 同步到安卓工程
```

发布新版本：改好代码并更新 `package.json` 的 `version` 和 `CHANGELOG.md`，然后

```bash
git tag v1.0.1 && git push origin v1.0.1
```

GitHub Actions 会自动编译签名的 APK 并发布到 Releases。签名密钥保存在仓库的 Secrets 里（`ANDROID_KEYSTORE_B64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`），每次都用同一把密钥签名，所以可以覆盖安装。

iOS 的 `iOS validation` 工作流独立验证并编译未签名模拟器 App，不会发布或生成真机安装包。iOS 的 API Key 保存在 Keychain，记录保存在原生原子文件中；可以导入现有安卓备份。

## 出处和授权

- 饮食和训练规则：《健身Excel超级套表》，作者 B站好人松松（文件名注明“可任意分享”）。本仓库不包含原表文件；助手用的 `www/js/data-kb.js` 是从原表整理出的文字（不含图片和格式），每条都带表号和行号，用来检索和标注出处。
- 动作图片：[free-exercise-db](https://github.com/yuhonas/free-exercise-db)，Unlicense（公有领域）。
- 节假日数据：[holiday-cn](https://github.com/NateScarlet/holiday-cn)，整理自国务院办公厅通知。
- 打包框架：[Capacitor](https://capacitorjs.com)，MIT。
- 界面字体：[Inter](https://rsms.me/inter/)，SIL Open Font License 1.1。

本应用是个人学习工具，不能代替医生建议。

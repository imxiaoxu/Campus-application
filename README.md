# 求职申请管理看板

面向大学生求职者的 React 单页应用，用于管理岗位申请、截止日期、材料提交状态和面试进度。

## 功能

- 按申请状态分列的看板视图。
- 新增、编辑、删除申请。
- 拖拽标题区或使用按钮切换状态。
- 按截止日期排序，筛选即将截止申请。
- 按公司、岗位、进度、备注搜索。
- 按优先级和材料提交状态筛选。
- 申请材料 checklist，支持自定义材料项。
- 打开标准 `.ics` 日历文件，可导入电脑和手机日历，包含 DDL 和面试流程时间。
- 本地登录、注册和访客登录。
- 顶栏提供语言切换、登录入口和深色/浅色/跟随系统主题切换。
- 详情页支持浏览器返回键回到看板。
- 使用 localStorage 本地持久化。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，默认是 `http://127.0.0.1:5173/`。

## 生产构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

## 部署到 Vercel

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，点击 `Add New...`，选择 `Project`。
3. 导入这个仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 点击 `Deploy`，部署完成后 Vercel 会生成公开访问链接。

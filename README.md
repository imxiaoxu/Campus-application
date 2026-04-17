# 求职申请管理看板

面向大学生求职者的 React 单页应用，用于管理岗位申请、截止日期、材料提交状态和面试进度。

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

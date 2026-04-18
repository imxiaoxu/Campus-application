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

## 适合中国大陆访问的部署方案

`vercel.app` 在中国大陆网络环境下经常无法稳定访问。这个项目是纯静态站，没有服务端依赖，建议改为下面两种方式：

### 方案 0：Cloudflare Pages

这是最省事的替代方案，适合先拿到一个比 Vercel 更容易访问的公开地址。

注意：它通常比 `vercel.app` 更省心，但依然不能保证中国大陆始终稳定。

当前线上地址：

- https://campus-application.pages.dev

仓库已经内置这些 Cloudflare Pages 配置：

- 配置文件 [wrangler.jsonc](/Users/bowenxu/Desktop/未命名文件夹%202/wrangler.jsonc#L1)
- GitHub Actions 工作流 [.github/workflows/deploy-cloudflare-pages.yml](/Users/bowenxu/Desktop/未命名文件夹%202/.github/workflows/deploy-cloudflare-pages.yml#L1)
- 本地调试脚本 [package.json](/Users/bowenxu/Desktop/未命名文件夹%202/package.json#L6)

#### 最少点击的方式：Cloudflare 控制台直接连 GitHub

1. 在 Cloudflare 打开 `Workers & Pages`。
2. 选择 `Create` -> `Pages` -> `Connect to Git`。
3. 选择这个 GitHub 仓库。
4. 构建配置填写：
   - Framework preset：`Vite`
   - Build command：`npm run build`
   - Build output directory：`dist`
5. 点击部署。

#### 想走自动发布：GitHub Actions

需要在 GitHub 仓库中配置：

- Secret `CLOUDFLARE_API_TOKEN`
- Secret `CLOUDFLARE_ACCOUNT_ID`
- Variable `CLOUDFLARE_PAGES_PROJECT_NAME`

配置完成后，推送到 `main` 会自动触发 Cloudflare Pages 部署。

#### 本地命令

```bash
npm run cf:preview
npm run cf:deploy
```

### 方案 A：Gitee Pages

适合现在立刻上线一个可访问版本。

1. 将仓库同步到 Gitee。
2. 在 Gitee 仓库中开启 Pages 服务，并把部署分支指向 `gitee-pages`。
3. 执行构建：

```bash
npm install
npm run build
```

4. 将 `dist/` 目录内容部署到 Gitee Pages 对应分支。

当前构建已经改成相对路径资源引用，直接部署到二级路径也能正常打开。

### GitHub Actions 自动发布到 Gitee Pages

仓库已经内置工作流 [.github/workflows/deploy-gitee-pages.yml](/Users/bowenxu/Desktop/未命名文件夹%202/.github/workflows/deploy-gitee-pages.yml#L1) 和发布脚本 [scripts/publish-gitee-pages.sh](/Users/bowenxu/Desktop/未命名文件夹%202/scripts/publish-gitee-pages.sh#L1)。

触发方式：

1. 推送到 GitHub 的 `main` 分支。
2. GitHub Actions 自动执行构建。
3. 构建产物 `dist/` 被强制推送到 Gitee 的 `gitee-pages` 分支。
4. 如果配置了 `GITEE_PASSWORD`，工作流会额外触发一次 Gitee Pages 重建。

需要在 GitHub 仓库中配置这些 Secrets：

- `GITEE_USERNAME`：Gitee 用户名。
- `GITEE_TOKEN`：Gitee Access Token，用于把构建产物推送到 Gitee 仓库。
- `GITEE_REPO`：Gitee 仓库路径，格式 `用户名/仓库名`。
- `GITEE_PASSWORD`：可选。只有当你的 Gitee Pages 仍然需要显式“重新部署”时才配置。

可选的 GitHub Actions Variables：

- `GITEE_PAGES_BRANCH`：默认是 `gitee-pages`。
- `GITEE_GIT_USER_NAME`：提交用户名。
- `GITEE_GIT_USER_EMAIL`：提交邮箱。

首次使用时需要你手动完成一次 Gitee Pages 初始化：

1. 在 Gitee 新建对应仓库。
2. 到仓库的 `服务 -> Gitee Pages` 页面。
3. 把部署分支设为 `gitee-pages`。
4. 手动点击一次“启动”或首次部署。

注意：我在 2026-04-18 查了 Gitee 官方帮助中心，`Gitee Pages` 和 `Gitee Pages Pro` 页面标题都标注了“功能已下线”，所以这套工作流只适用于你的账号和仓库仍然能看到并启用 Pages 服务的情况。如果你的账号侧已经没有 Pages 入口，建议直接转阿里云 OSS + CDN。

### 方案 B：阿里云 OSS + CDN + 自定义域名

适合正式长期使用，也是中国大陆访问稳定性更高的方案。

1. 执行构建：

```bash
npm install
npm run build
```

2. 将 `dist/` 目录上传到阿里云 OSS 静态网站托管。
3. 前面挂阿里云 CDN。
4. 绑定自定义域名。
5. 如果域名面向中国大陆公开访问，需要完成 ICP 备案。

### GitHub Actions 自动发布到阿里云 OSS

仓库已经内置工作流 [.github/workflows/deploy-aliyun-oss.yml](/Users/bowenxu/Desktop/未命名文件夹%202/.github/workflows/deploy-aliyun-oss.yml#L1) 和上传脚本 [scripts/publish-aliyun-oss.sh](/Users/bowenxu/Desktop/未命名文件夹%202/scripts/publish-aliyun-oss.sh#L1)。

触发方式：

1. 推送到 GitHub 的 `main` 分支。
2. GitHub Actions 自动构建项目。
3. 工作流安装 `ossutil`。
4. 工作流把 `dist/` 同步到指定 OSS Bucket。

需要在 GitHub 仓库中配置这些 Secrets：

- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`

需要在 GitHub 仓库中配置这些 Variables：

- `OSS_BUCKET`：Bucket 名称，例如 `campus-application-board-prod`
- `OSS_ENDPOINT`：Bucket 所在地域公网 Endpoint，例如 `oss-cn-hangzhou.aliyuncs.com`
- `OSS_PREFIX`：可选。上传到 Bucket 下某个子目录时填写，例如 `site`
- `OSS_DELETE`：可选。设为 `true` 时，OSS 中多余文件会被删除；默认不删

建议为发布单独创建一个 RAM 用户，并且只授予目标 Bucket 的最小权限：

- `oss:PutObject`
- `oss:ListObjects`
- `oss:DeleteObject`，仅当 `OSS_DELETE=true` 时需要

### OSS、CDN、域名接入步骤

#### 1. 创建并配置 OSS Bucket

1. 在中国大陆地域创建 Bucket。
2. 把站点部署进去。
3. 为 Bucket 开启静态网站托管。
4. 首页文档填写 `index.html`，默认 404 页面填写 `404.html`。

#### 2. 绑定 CDN

1. 在阿里云 CDN 中添加加速域名，例如 `job.example.com`。
2. 源站选择 OSS Bucket。
3. 等待域名状态变为可用。

#### 3. 配置 DNS

1. 按阿里云 CDN 控制台给出的 CNAME 记录配置 DNS。
2. 等待解析生效后再切正式流量。

#### 4. 完成备案

如果加速区域选择中国大陆或全球，并且这个域名用于站点访问，需要先完成 ICP 备案。

#### 5. 证书与 HTTPS

1. 给访问域名申请证书。
2. 在 CDN 上绑定证书并开启 HTTPS。

#### 6. 发布后刷新 CDN 缓存

如果你更新了首页或入口文件，CDN 可能继续返回旧缓存。发布完成后建议至少刷新这些路径：

- `/index.html`
- `/404.html`

如果你没有给 HTML 单独设置较短缓存时间，也可以在阿里云 CDN 控制台按目录刷新站点目录。

### 推荐的生产结构

- GitHub：源码仓库
- GitHub Actions：自动构建
- OSS：静态文件源站
- CDN：大陆访问入口
- 已备案域名：正式外部地址

## 兼容性说明

- 构建产物会额外生成 `404.html`，方便部署到常见静态托管。
- 当前应用详情页使用 hash，不依赖服务端路由，适合 OSS、Gitee Pages 这类纯静态环境。

## 原有方案：部署到 Vercel

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，点击 `Add New...`，选择 `Project`。
3. 导入这个仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 点击 `Deploy`，部署完成后 Vercel 会生成公开访问链接。

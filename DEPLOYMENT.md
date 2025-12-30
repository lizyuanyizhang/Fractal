# Fractal 应用部署指南

## 📋 部署前准备

### 1. 确保 Supabase 数据库已设置

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 SQL Editor
4. 执行 `database/create_tasks_table.sql` 创建 tasks 表
5. 验证表已创建（在 Table Editor 中查看）

### 2. 本地构建测试

在部署前，先在本地测试构建：

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

如果预览正常，说明构建成功，可以继续部署。

---

## 🚀 部署方案

### 方案一：Vercel（推荐，最简单）

Vercel 是部署 React + Vite 应用的最佳选择，自动配置，零配置部署。

#### 步骤：

1. **安装 Vercel CLI（可选）**
   ```bash
   npm install -g vercel
   ```

2. **通过 Vercel 网站部署（推荐）**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录
   - 点击 "New Project"
   - 导入你的 Fractal 项目仓库
   - 配置项目：
     - **Framework Preset**: Vite
     - **Root Directory**: `./`（默认）
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **配置环境变量**
   - 在 Vercel 项目设置中，进入 "Environment Variables"
   - 添加以下变量：
     ```
     VITE_SUPABASE_URL=https://czutuggywxcpedyentyv.supabase.co
     VITE_SUPABASE_ANON_KEY=你的完整anon_key
     ```
   - 选择环境：Production, Preview, Development（全选）

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（通常 1-2 分钟）
   - 部署成功后，会获得一个 URL：`https://your-project.vercel.app`

5. **自动部署**
   - 每次推送到 GitHub 主分支，Vercel 会自动重新部署

#### 使用 Vercel CLI 部署：

```bash
# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

---

### 方案二：Netlify

Netlify 也是很好的选择，提供类似的自动部署功能。

#### 步骤：

1. **访问 [netlify.com](https://www.netlify.com)**
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **创建新站点**
   - 点击 "Add new site" → "Import an existing project"
   - 选择你的仓库

3. **配置构建设置**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `./`

4. **配置环境变量**
   - 进入 Site settings → Environment variables
   - 添加：
     ```
     VITE_SUPABASE_URL=https://czutuggywxcpedyentyv.supabase.co
     VITE_SUPABASE_ANON_KEY=你的完整anon_key
     ```

5. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

---

### 方案三：GitHub Pages

适合开源项目，免费但需要手动配置。

#### 步骤：

1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **更新 package.json**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://your-username.github.io/fractal"
   }
   ```

3. **更新 vite.config.ts**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/fractal/', // 如果你的仓库名是 fractal
   })
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **配置环境变量**
   - GitHub Pages 不支持服务端环境变量
   - 需要将环境变量直接写入代码（不推荐，安全性低）
   - 或者使用构建时替换脚本

---

### 方案四：自托管（VPS/服务器）

如果你有自己的服务器，可以使用 Nginx 或 Apache。

#### 使用 Nginx：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传 dist 目录到服务器**

3. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/fractal/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **配置 HTTPS（推荐）**
   - 使用 Let's Encrypt 免费 SSL 证书
   - 或使用 Cloudflare 的免费 SSL

---

## 🔐 环境变量配置

### 生产环境变量

在所有部署平台上，都需要配置以下环境变量：

```
VITE_SUPABASE_URL=https://czutuggywxcpedyentyv.supabase.co
VITE_SUPABASE_ANON_KEY=你的完整anon_key
```

### 注意事项

- ⚠️ **不要**将 `.env` 文件提交到 Git
- ✅ 使用部署平台的环境变量功能
- ✅ `VITE_` 前缀的变量会在构建时注入到前端代码中
- ⚠️ anon key 是公开的，但 Supabase 的 RLS 会保护数据安全

---

## 🗄️ Supabase 数据库配置

### 1. 创建 tasks 表

在 Supabase SQL Editor 中执行：

```sql
-- 执行 database/create_tasks_table.sql 文件中的所有内容
```

### 2. 配置 RLS（Row Level Security）

确保 RLS 已启用（SQL 文件中已包含）

### 3. 测试数据库连接

部署后，在应用中测试：
- 创建任务
- 查询任务
- 更新任务

---

## 🌐 自定义域名（可选）

### Vercel

1. 进入项目设置 → Domains
2. 添加你的域名
3. 按照提示配置 DNS 记录

### Netlify

1. 进入 Site settings → Domain management
2. 添加自定义域名
3. 配置 DNS 记录

---

## 📊 部署后检查清单

- [ ] 应用可以正常访问
- [ ] Supabase 连接正常（查看浏览器控制台）
- [ ] 可以创建任务（TheVoid 视图）
- [ ] 可以查看任务树（ThePrism 视图）
- [ ] 可以拖拽任务（InterestGravity 视图）
- [ ] 可以进入专注模式（FocusTunnel 视图）
- [ ] 环境变量已正确配置
- [ ] HTTPS 已启用（生产环境必须）
- [ ] 数据库表已创建
- [ ] RLS 策略已启用

---

## 🔧 故障排查

### 问题：Supabase 连接失败

**解决方案：**
1. 检查环境变量是否正确配置
2. 检查 Supabase URL 格式：`https://[项目ID].supabase.co`
3. 检查 anon key 是否完整（JWT token）
4. 查看浏览器控制台的错误信息

### 问题：构建失败

**解决方案：**
1. 检查 TypeScript 错误：`npm run build`
2. 检查依赖是否完整：`npm install`
3. 查看构建日志中的具体错误

### 问题：路由 404

**解决方案：**
- 确保服务器配置了 SPA 回退到 `index.html`
- Vercel/Netlify 通常自动处理
- 自托管需要配置 Nginx/Apache

---

## 📈 性能优化建议

1. **启用 CDN**（Vercel/Netlify 自动提供）
2. **压缩资源**（构建工具自动处理）
3. **代码分割**（Vite 自动处理）
4. **图片优化**（如有图片，使用 WebP 格式）
5. **启用缓存**（配置 HTTP 缓存头）

---

## 🎉 完成！

部署成功后，你的应用就可以在互联网上访问了！

**推荐部署平台：Vercel**（最简单、最快、最稳定）

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)


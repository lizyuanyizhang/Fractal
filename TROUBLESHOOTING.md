# Fractal 应用故障排查指南

## 🔍 页面显示空白/深蓝色

### 步骤 1：检查浏览器控制台

1. 打开浏览器开发者工具（F12 或 Cmd+Option+I）
2. 查看 **Console** 标签页
3. 查看是否有红色错误信息

**常见错误：**

#### 错误 1：环境变量未设置
```
Supabase URL 或 Anon Key 未设置
```

**解决方案：**
- 在 Vercel 项目设置中添加环境变量
- 参考下面的"配置 Vercel 环境变量"部分

#### 错误 2：JavaScript 错误
```
Uncaught Error: ...
```

**解决方案：**
- 检查错误信息
- 可能需要重新构建和部署

---

## ⚙️ 配置 Vercel 环境变量

### 步骤：

1. **登录 Vercel Dashboard**
   - 访问 [vercel.com](https://vercel.com)
   - 登录你的账号

2. **进入项目设置**
   - 选择 `fractalintp` 项目
   - 点击 **Settings**
   - 左侧菜单选择 **Environment Variables**

3. **添加环境变量**
   
   添加以下两个变量：
   
   **变量 1：**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://czutuggywxcpedyentyv.supabase.co`
   - **Environment**: 选择所有环境（Production, Preview, Development）
   
   **变量 2：**
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dXR1Z2d5d3hjcGVkeWVudHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDA0MTYsImV4cCI6MjA4MjY3NjQxNn0.KEOAmTQIIRdielqNNKOBWoFFo3EBBJ-LzMn6bRsVFis`
   - **Environment**: 选择所有环境

4. **重新部署**
   - 环境变量添加后，需要重新部署
   - 点击 **Deployments** 标签
   - 找到最新的部署，点击右侧的 **...** 菜单
   - 选择 **Redeploy**

---

## 🔧 其他常见问题

### 问题 1：页面加载但功能不工作

**可能原因：**
- Supabase 数据库表未创建
- RLS 策略未配置

**解决方案：**
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `database/create_tasks_table.sql`
4. 验证表已创建（Table Editor 中查看）

### 问题 2：构建失败

**检查：**
1. Vercel 部署日志
2. 本地构建测试：`npm run build`

**常见原因：**
- TypeScript 错误
- 依赖缺失
- 环境变量格式错误

### 问题 3：样式不显示

**检查：**
1. Tailwind CSS 是否正确构建
2. 浏览器控制台是否有 CSS 加载错误
3. 检查 `dist` 目录中的 CSS 文件

---

## 🧪 本地测试

在修复问题前，先在本地测试：

```bash
# 1. 确保环境变量已设置
cat .env

# 2. 构建测试
npm run build

# 3. 预览构建结果
npm run preview
```

如果本地正常，问题可能在 Vercel 配置。

---

## 📋 检查清单

部署后，按以下清单检查：

- [ ] Vercel 环境变量已配置
- [ ] 环境变量已重新部署
- [ ] 浏览器控制台无错误
- [ ] Supabase 数据库表已创建
- [ ] 网络连接正常
- [ ] 浏览器缓存已清除（Cmd+Shift+R）

---

## 🆘 如果仍然无法解决

1. **查看 Vercel 部署日志**
   - Vercel Dashboard → Deployments → 点击部署 → View Build Logs

2. **检查浏览器网络请求**
   - 开发者工具 → Network 标签
   - 查看是否有失败的请求

3. **检查 Supabase 连接**
   - 浏览器控制台查看 Supabase 相关错误
   - 确认 URL 和 Key 正确

4. **重新部署**
   - 在 Vercel 中触发新的部署
   - 或推送新提交到 GitHub

---

## 💡 快速修复命令

如果问题在本地，可以尝试：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf dist .vite

# 重新构建
npm run build

# 测试
npm run preview
```


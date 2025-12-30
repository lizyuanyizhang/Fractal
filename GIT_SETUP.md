# Git 身份验证设置指南

## 问题说明

GitHub 已不再支持密码认证，需要使用以下方式之一：

1. **Personal Access Token (PAT)** - 推荐，简单快速
2. **SSH 密钥** - 更安全，一次设置永久使用

---

## 方案一：使用 Personal Access Token (PAT) - 推荐

### 步骤 1：创建 Personal Access Token

1. 登录 [GitHub](https://github.com)
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. 点击 **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token** → **Generate new token (classic)**
6. 填写信息：
   - **Note**: `Fractal Project` (描述用途)
   - **Expiration**: 选择过期时间（建议 90 天或 No expiration）
   - **Select scopes**: 勾选 `repo` (完整仓库访问权限)
7. 点击 **Generate token**
8. **重要**：复制生成的 token（只显示一次！格式类似：`ghp_xxxxxxxxxxxxxxxxxxxx`）

### 步骤 2：使用 Token 推送代码

在终端中运行：

```bash
# 方法 1：在 URL 中使用 token（一次性）
git remote set-url origin https://ghp_你的token@github.com/lizyuanyizhang/Fractal.git
git push -u origin main
```

或者：

```bash
# 方法 2：使用 Git Credential Manager（推荐）
git push -u origin main
# 当提示输入用户名时，输入你的 GitHub 用户名
# 当提示输入密码时，粘贴你的 Personal Access Token（不是密码！）
```

### 步骤 3：保存凭据（可选）

```bash
# 使用 Git Credential Manager 保存凭据
git config --global credential.helper osxkeychain  # macOS
# 或
git config --global credential.helper store       # 所有系统
```

---

## 方案二：使用 SSH 密钥（更安全，推荐长期使用）

### 步骤 1：检查是否已有 SSH 密钥

```bash
ls -al ~/.ssh
```

如果看到 `id_rsa.pub` 或 `id_ed25519.pub`，说明已有密钥，跳到步骤 3。

### 步骤 2：生成新的 SSH 密钥

```bash
# 生成 SSH 密钥（使用你的 GitHub 邮箱）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按 Enter 使用默认路径
# 设置密码（可选，建议设置）
```

### 步骤 3：将 SSH 密钥添加到 ssh-agent

```bash
# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加密钥到 ssh-agent
ssh-add ~/.ssh/id_ed25519
```

### 步骤 4：复制公钥

```bash
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub
# 或
pbcopy < ~/.ssh/id_ed25519.pub  # macOS 自动复制到剪贴板
```

### 步骤 5：将公钥添加到 GitHub

1. 登录 [GitHub](https://github.com)
2. 点击右上角头像 → **Settings**
3. 左侧菜单 → **SSH and GPG keys**
4. 点击 **New SSH key**
5. 填写：
   - **Title**: `MacBook Pro` (描述)
   - **Key**: 粘贴刚才复制的公钥内容
6. 点击 **Add SSH key**

### 步骤 6：测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到 `Hi lizyuanyizhang! You've successfully authenticated...`，说明成功。

### 步骤 7：更改远程仓库 URL 为 SSH

```bash
# 将 HTTPS URL 改为 SSH URL
git remote set-url origin git@github.com:lizyuanyizhang/Fractal.git

# 验证
git remote -v

# 推送
git push -u origin main
```

---

## 快速解决方案（推荐）

如果你现在就想推送代码，使用 **方案一（PAT）** 最快：

1. 创建 Personal Access Token（5分钟）
2. 运行：
   ```bash
   git push -u origin main
   ```
3. 用户名：输入你的 GitHub 用户名
4. 密码：粘贴你的 Personal Access Token（不是 GitHub 密码！）

---

## 常见问题

### Q: Token 在哪里查看？

A: Token 创建后只显示一次，如果丢失需要重新创建。

### Q: 如何撤销 Token？

A: GitHub Settings → Developer settings → Personal access tokens → 找到对应 token → Delete

### Q: SSH 连接失败？

A: 检查：
- 公钥是否正确添加到 GitHub
- SSH agent 是否运行：`eval "$(ssh-agent -s)"`
- 密钥是否添加：`ssh-add ~/.ssh/id_ed25519`

### Q: 如何切换回 HTTPS？

A: 
```bash
git remote set-url origin https://github.com/lizyuanyizhang/Fractal.git
```

---

## 推荐配置

**短期使用**：Personal Access Token（快速简单）  
**长期使用**：SSH 密钥（更安全，一次配置永久使用）


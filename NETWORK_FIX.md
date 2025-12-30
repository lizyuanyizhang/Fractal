# GitHub 连接问题解决方案

## 问题
```
Failed to connect to github.com port 443: Couldn't connect to server
```

这表示无法连接到 GitHub 服务器。

---

## 解决方案

### 方案一：检查网络连接

```bash
# 测试网络连接
ping github.com

# 测试 HTTPS 连接
curl -I https://github.com
```

如果无法连接，可能是网络问题。

---

### 方案二：使用代理（如果你在使用 VPN/代理）

如果你在使用 VPN 或代理，需要配置 Git：

```bash
# 设置 HTTP 代理（替换为你的代理地址和端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 查看当前代理设置
git config --global --get http.proxy

# 如果需要取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

常见代理端口：
- Clash: `7890` 或 `7891`
- V2Ray: `10808` 或 `10809`
- Shadowsocks: `1080`

---

### 方案三：使用 SSH 代替 HTTPS（推荐）

SSH 连接通常更稳定，不受 HTTPS 端口限制。

#### 1. 检查是否已有 SSH 密钥

```bash
ls -al ~/.ssh
```

如果看到 `id_rsa.pub` 或 `id_ed25519.pub`，说明已有密钥。

#### 2. 如果没有，生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# 按 Enter 使用默认路径
# 设置密码（可选）
```

#### 3. 复制公钥

```bash
# macOS
pbcopy < ~/.ssh/id_ed25519.pub

# 或手动查看
cat ~/.ssh/id_ed25519.pub
```

#### 4. 添加到 GitHub

1. 访问：https://github.com/settings/keys
2. 点击 "New SSH key"
3. Title: `MacBook Pro`
4. Key: 粘贴刚才复制的公钥
5. 点击 "Add SSH key"

#### 5. 测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到 `Hi lizyuanyizhang! You've successfully authenticated...`，说明成功。

#### 6. 更改远程仓库 URL 为 SSH

```bash
# 将 HTTPS 改为 SSH
git remote set-url origin git@github.com:lizyuanyizhang/Fractal.git

# 验证
git remote -v

# 推送
git push -u origin main
```

---

### 方案四：使用 GitHub 镜像（临时方案）

如果 GitHub 访问受限，可以使用镜像：

```bash
# 使用 GitHub 镜像（不推荐，仅临时使用）
git remote set-url origin https://ghproxy.com/https://github.com/lizyuanyizhang/Fractal.git
```

---

### 方案五：检查 DNS 设置

如果 DNS 解析有问题：

```bash
# 测试 DNS 解析
nslookup github.com

# 如果解析失败，可以临时使用其他 DNS
# 在系统设置中更改 DNS 为：
# 8.8.8.8 (Google DNS)
# 或 1.1.1.1 (Cloudflare DNS)
```

---

## 推荐操作顺序

1. **首先尝试方案三（SSH）** - 最稳定可靠
2. 如果使用 VPN，尝试方案二（配置代理）
3. 如果都不行，检查网络连接（方案一）

---

## 快速测试

运行以下命令测试连接：

```bash
# 测试 HTTPS
curl -I https://github.com

# 测试 SSH（如果已配置）
ssh -T git@github.com
```

如果都能连接，说明网络正常，问题可能在 Git 配置。


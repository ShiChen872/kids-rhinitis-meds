# 部署手册（给 Hermes / 服务器）

源码在 GitHub，太太访问的是腾讯云轻量上的静态页。不要用 GitHub Pages。

- 仓库：见 README 顶部 GitHub 地址（默认 `main`）
- 服务器：腾讯云轻量新加坡，SSH 本机主机名 `OpenClaw-Server`（`ubuntu@43.134.226.112`）
- 源码目录（服务器上）：`/home/ubuntu/kids-rhinitis-meds`
- 网站目录：`/var/www/yao`
- 访问：`http://43.134.226.112/yao/`
- 禁止：改 Hermes 进程、改微信网关、新开 8080、动邮箱 DNS

## 第一次

服务器上需要：`git`、`nginx`、Node 22（或已有 Node 20+）。

```bash
sudo mkdir -p /var/www/yao
sudo chown -R ubuntu:ubuntu /var/www/yao
git clone https://github.com/ShiChen872/kids-rhinitis-meds.git /home/ubuntu/kids-rhinitis-meds
cd /home/ubuntu/kids-rhinitis-meds
npm ci
bash scripts/server-update.sh
```

把下面片段并进**已有** nginx 的 `server { }`（不要新建抢 80 的 default_server，以免冲掉 Hermes）：

```
location /yao/ {
    alias /var/www/yao/;
    index index.html;
    add_header Cache-Control "no-cache";
}
```

然后 `sudo nginx -t && sudo systemctl reload nginx`。腾讯云安全组放行 80。

## 以后更新（Hermes 每次发版执行这些）

```bash
cd /home/ubuntu/kids-rhinitis-meds
git fetch origin
git checkout main
git pull --ff-only origin main
npm ci
bash scripts/server-update.sh
```

只发布 `dist/` 到 `/var/www/yao`。用药记录在用户手机里，不要备份、不要清空 `/var/www/yao` 以外的数据。

## 本机 Cursor 改代码

在这个仓库改 → commit → push `main` → 让 Hermes 在服务器跑「以后更新」。

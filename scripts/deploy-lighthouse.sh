#!/usr/bin/env bash
# 把用药静态页同步到腾讯云轻量（SSH Host: OpenClaw-Server）
# 不改 Hermes；只放 /var/www/yao，并由 nginx 提供 /yao/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${SSH_HOST:-OpenClaw-Server}"
REMOTE_DIR="/var/www/yao"

cd "$ROOT"
npm run build

ssh "$HOST" "sudo mkdir -p '$REMOTE_DIR' && sudo chown -R ubuntu:ubuntu '$REMOTE_DIR'"
rsync -avz --delete "$ROOT/dist/" "$HOST:$REMOTE_DIR/"

ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi

# 若已有站点配置，只写入独立片段，避免覆盖 Hermes 反代
SNIPPET=/etc/nginx/conf.d/yao.conf
sudo tee "$SNIPPET" >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /yao/ {
        alias /var/www/yao/;
        index index.html;
        add_header Cache-Control "no-cache";
    }
}
NGINX

# 若 default_server 冲突，不要强行 reload 失败后留下坏配置
if sudo nginx -t; then
  sudo systemctl enable nginx
  sudo systemctl reload nginx || sudo systemctl start nginx
  echo "nginx ok"
else
  echo "nginx 配置冲突：可能 80 已被 Hermes/其它站点占用。文件已放到 /var/www/yao，请把 location /yao/ 手工并进现有 server。"
  sudo rm -f "$SNIPPET"
  exit 2
fi
REMOTE

IP="$(ssh -G "$HOST" | awk '/^hostname / {print $2; exit}')"
echo
echo "打开：http://${IP}/yao/"
echo "用 Safari 打开后：分享 → 添加到主屏幕"

#!/usr/bin/env bash
# 在腾讯云轻量本机执行：编译当前 Git 版本并发布到 /var/www/yao
# 不改 nginx、不改 Hermes。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${YAO_DEST:-/var/www/yao}"

cd "$ROOT"
npm run build

mkdir -p "$DEST"
rsync -a --delete "$ROOT/dist/" "$DEST/"

echo "published $(git rev-parse --short HEAD) -> $DEST"
echo "open /yao/ on this host"

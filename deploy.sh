#!/bin/bash
set -euo pipefail

# ─── Variables ───────────────────────────────────────────────────────────────
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_OUTPUT_DIR="$FRONTEND_DIR/deploy"

echo "=========================================================="
echo "          SSO Frontend Build & Deploy Script              "
echo "=========================================================="

# 1. Build Frontend (React + Vite)
echo "[1/2] Building Frontend (React + Vite)..."
cd "$FRONTEND_DIR"
npm ci
npm run build
echo "✅ Frontend built successfully: dist/"

# 2. Prepare Deploy Directory
echo "[2/2] Preparing deployment artifacts..."
rm -rf "$BUILD_OUTPUT_DIR"
mkdir -p "$BUILD_OUTPUT_DIR"
cp -r "$FRONTEND_DIR/dist/"* "$BUILD_OUTPUT_DIR/"

echo "=========================================================="
echo "✅ Build Complete!"
echo "Artifacts are located in: $BUILD_OUTPUT_DIR"
echo ""
echo "─── Nginx Reverse Proxy Configuration ───"
echo "To host the SSO frontend under /sso/, add the following to your Nginx configuration:"
echo ""
echo "location /sso/ {"
echo "    alias /var/www/sso/frontend/;"
echo "    try_files \$uri \$uri/ /sso/index.html;"
echo "}"
echo "=========================================================="

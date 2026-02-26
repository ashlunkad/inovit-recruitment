#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# INOVIT Recruitment Platform - Auto Install Script
# For: Ubuntu 22.04 VPS with Docker + Nginx Proxy Manager
# Domain: hire.inovit.in
# ═══════════════════════════════════════════════════════════════

set -e
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   INOVIT Recruitment Platform - Auto Installer   ║"
echo "║   hire.inovit.in                                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Install Node.js 20 ──
echo "📦 [1/7] Installing Node.js 20..."
if command -v node &> /dev/null; then
    echo "   Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    echo "   ✅ Node.js installed: $(node -v)"
fi

# ── Step 2: Install MongoDB 7 ──
echo "📦 [2/7] Installing MongoDB..."
if command -v mongod &> /dev/null; then
    echo "   MongoDB already installed: $(mongod --version | head -1)"
else
    apt-get install -y gnupg curl
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    echo "   ✅ MongoDB installed and running"
fi

# ── Step 3: Install PM2 (keeps app running forever) ──
echo "📦 [3/7] Installing PM2 process manager..."
npm install -g pm2 2>/dev/null || true
echo "   ✅ PM2 installed"

# ── Step 4: Create app directory ──
echo "📁 [4/7] Setting up project..."
APP_DIR="/opt/inovit-recruitment"
mkdir -p $APP_DIR
cd $APP_DIR

# Download and extract project (if not already there)
if [ ! -f "$APP_DIR/backend/package.json" ]; then
    echo "   Waiting for project files..."
    echo "   ⚠️  You need to upload the project files to $APP_DIR"
    echo "   See the guide for instructions"
fi

# ── Step 5: Setup Backend ──
echo "📦 [5/7] Installing backend dependencies..."
cd $APP_DIR/backend

# Create .env file
cat > .env << 'ENVFILE'
MONGODB_URI=mongodb://localhost:27017/inovit_recruitment
JWT_SECRET=inovit-hire-2026-production-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
CLIENT_URL=https://hire.inovit.in
WATI_API_URL=
WATI_API_TOKEN=
ENVFILE

npm install --production
echo "   ✅ Backend ready"

# ── Step 6: Setup Frontend ──
echo "📦 [6/7] Building frontend..."
cd $APP_DIR/frontend

# Create .env for frontend build
cat > .env << 'ENVFILE'
VITE_API_URL=https://hire.inovit.in/api
ENVFILE

npm install
npm run build
echo "   ✅ Frontend built"

# ── Step 7: Configure PM2 ──
echo "🚀 [7/7] Starting application..."
cd $APP_DIR

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2FILE'
module.exports = {
  apps: [
    {
      name: 'inovit-api',
      script: 'backend/src/server.js',
      cwd: '/opt/inovit-recruitment',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      log_file: '/opt/inovit-recruitment/logs/api.log',
      error_file: '/opt/inovit-recruitment/logs/api-error.log',
    }
  ]
};
PM2FILE

mkdir -p logs

# Install serve for frontend static files
npm install -g serve 2>/dev/null || true

# Start backend with PM2
pm2 delete inovit-api 2>/dev/null || true
pm2 delete inovit-frontend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 start "serve -s frontend/dist -l 5173" --name inovit-frontend
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║            ✅ INSTALLATION COMPLETE!              ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Backend API:  http://localhost:5000              ║"
echo "║  Frontend:     http://localhost:5173              ║"
echo "║                                                  ║"
echo "║  Next steps:                                     ║"
echo "║  1. Seed demo data (run once):                   ║"
echo "║     curl http://localhost:5000/api/seed-demo-data ║"
echo "║                                                  ║"
echo "║  2. Add hire.inovit.in in Nginx Proxy Manager    ║"
echo "║     (see guide for details)                      ║"
echo "║                                                  ║"
echo "║  3. Login: admin@inovit.in / admin123            ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

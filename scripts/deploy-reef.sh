#!/usr/bin/env bash
# Idempotent deploy script for reef (Cloudflare-tunneled box at 100.126.31.123).
# Run as the kokomo user. Pulls latest main, installs, builds, seeds, restarts.
#
# Usage:
#   ssh kokomo@100.126.31.123 'bash -s' < scripts/deploy-reef.sh
# Or, after first run:
#   ssh kokomo@100.126.31.123 'cd ~/dev/nucleus-connections-hub && bash scripts/deploy-reef.sh'

set -euo pipefail

REPO_URL="https://github.com/Elenion88/nucleus-connections-hub.git"
DEPLOY_DIR="$HOME/dev/nucleus-connections-hub"
PORT=4012

echo "==> deploy starting at $(date)"

# 1. Clone or update
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "==> cloning fresh"
  mkdir -p "$(dirname "$DEPLOY_DIR")"
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  echo "==> pulling latest"
  git -C "$DEPLOY_DIR" fetch origin
  git -C "$DEPLOY_DIR" reset --hard origin/main
fi

cd "$DEPLOY_DIR"

# 2. Install + build web
echo "==> npm install (server)"
( cd app/server && npm install --silent )

echo "==> npm install (web)"
( cd app/web && npm install --silent )

echo "==> vite build"
( cd app/web && npm run build )

# 3. Ensure .env exists on server (don't overwrite)
if [ ! -f app/server/.env ]; then
  echo "==> ERROR: app/server/.env not present on this host."
  echo "    Copy .env.example to .env and fill OPENROUTER_API_KEY before re-running."
  echo "    (kept separate so the deploy script never sees the secret.)"
  exit 1
fi

# 4. Migrate + seed + embed if database is empty
if [ ! -s app/server/nucleus.db ]; then
  echo "==> migrating + seeding database"
  ( cd app/server && npm run migrate && npm run seed:load && npm run seed:embed )
else
  echo "==> database already seeded, skipping (delete app/server/nucleus.db to reseed)"
fi

# 5. Make sure PORT is set in .env (default to 4012)
if ! grep -q "^PORT=" app/server/.env; then
  echo "PORT=$PORT" >> app/server/.env
fi

echo "==> deploy directory ready at $DEPLOY_DIR"
echo "==> next: install systemd unit at /etc/systemd/system/nucleus.service"
echo "    (see scripts/nucleus.service)"

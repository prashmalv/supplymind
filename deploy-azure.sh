#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SupplyMind — Azure redeploy script (resource already exists)
# Usage:  bash deploy-azure.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP_NAME="supplymind-demo"
RESOURCE_GROUP="supplymind-rg"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }
err()  { echo -e "${RED}✖ $1${NC}"; exit 1; }

PATH="/opt/homebrew/bin:$PATH"

# ── 1. Check Azure login ──────────────────────────────────────────────────────
log "Checking Azure login..."
command -v az &>/dev/null || err "Azure CLI not found. Install: brew install azure-cli"
az account show &>/dev/null  || err "Not logged in. Run: az login"
ok "Logged in as: $(az account show --query user.name -o tsv)"

# ── 2. Build ──────────────────────────────────────────────────────────────────
log "Building SupplyMind..."
export GEMINI_API_KEY="$GEMINI_API_KEY"
npm install --silent
npm run build
ok "Build complete → dist/"

# ── 3. Get deployment token ───────────────────────────────────────────────────
log "Fetching deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" -o tsv)
[[ -n "$DEPLOY_TOKEN" ]] || err "Could not get token. Check app name / resource group."
ok "Token retrieved"

# ── 4. Deploy ─────────────────────────────────────────────────────────────────
log "Deploying to Azure..."
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "$DEPLOY_TOKEN" \
  --env production

# ── 5. Print URL ──────────────────────────────────────────────────────────────
HOSTNAME=$(az staticwebapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SupplyMind is LIVE!${NC}"
echo -e "${GREEN}  https://${HOSTNAME}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

[[ -z "$GEMINI_API_KEY" ]] && warn "Demo mode active (no Gemini key). Run: GEMINI_API_KEY=your_key bash deploy-azure.sh"

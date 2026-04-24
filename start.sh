#!/usr/bin/env bash
# =============================================================================
#  Eagle Game Engine 2D  –  Startup Script
#  Installs prerequisites, initialises the database, and launches both the
#  FastAPI backend and the Vite-powered React frontend.
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
BLUE='\033[0;34m'
WHITE='\033[1;37m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Colour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$LOG_DIR"

banner() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${WHITE}        Eagle Game Engine 2D  –  v1.0.0              ${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}     Classroom-Friendly 2D Game Creation Platform     ${BLUE}║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
}

step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

ok() {
  echo -e "${GREEN}✔ $1${NC}"
}

err() {
  echo -e "${RED}✖ $1${NC}" >&2
}

# ── Prerequisite checks ───────────────────────────────────────────────────────
check_prereqs() {
  step "Checking prerequisites …"

  # Python 3.10+
  if ! command -v python3 &>/dev/null; then
    err "python3 not found. Please install Python 3.10 or newer."
    exit 1
  fi
  PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
  PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
  PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
  if [[ "$PYTHON_MAJOR" -lt 3 ]] || { [[ "$PYTHON_MAJOR" -eq 3 ]] && [[ "$PYTHON_MINOR" -lt 10 ]]; }; then
    err "Python 3.10+ is required. Found $PYTHON_VERSION."
    exit 1
  fi
  ok "Python $PYTHON_VERSION"

  # Node 18+
  if ! command -v node &>/dev/null; then
    step "Node.js not found. Attempting to install via NodeSource …"
    if command -v curl &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
    else
      err "Node.js not found and could not install automatically. Please install Node.js 18+."
      exit 1
    fi
  fi
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    err "Node.js 18+ is required. Found $NODE_VERSION."
    exit 1
  fi
  ok "Node.js $NODE_VERSION"

  # npm
  if ! command -v npm &>/dev/null; then
    err "npm not found. Please install npm."
    exit 1
  fi
  ok "npm $(npm --version)"
}

# ── Backend setup ─────────────────────────────────────────────────────────────
setup_backend() {
  step "Setting up Python virtual environment …"
  if [[ ! -d "$VENV_DIR" ]]; then
    python3 -m venv "$VENV_DIR"
    ok "Virtual environment created at $VENV_DIR"
  else
    ok "Virtual environment already exists"
  fi

  step "Installing Python dependencies …"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet -r "$BACKEND_DIR/requirements.txt"
  ok "Python dependencies installed"

  # Ensure uploads directory exists
  mkdir -p "$BACKEND_DIR/uploads"
  ok "Uploads directory ready"
}

# ── Frontend setup ────────────────────────────────────────────────────────────
setup_frontend() {
  step "Installing Node.js dependencies …"
  cd "$FRONTEND_DIR"
  npm install --silent
  ok "Node.js dependencies installed"
  cd "$SCRIPT_DIR"
}

# ── Launch services ───────────────────────────────────────────────────────────
launch_backend() {
  step "Starting FastAPI backend on http://localhost:8000 …"
  cd "$BACKEND_DIR"
  "$VENV_DIR/bin/uvicorn" main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    > "$LOG_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo $BACKEND_PID > "$LOG_DIR/backend.pid"
  ok "Backend started  (PID $BACKEND_PID) — logs: $LOG_DIR/backend.log"
  cd "$SCRIPT_DIR"
}

launch_frontend() {
  step "Starting Vite dev server on http://localhost:5173 …"
  cd "$FRONTEND_DIR"
  npm run dev -- --host 0.0.0.0 \
    > "$LOG_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
  ok "Frontend started (PID $FRONTEND_PID) — logs: $LOG_DIR/frontend.log"
  cd "$SCRIPT_DIR"
}

wait_for_backend() {
  step "Waiting for backend to become ready …"
  for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
      ok "Backend is up!"
      return 0
    fi
    sleep 1
  done
  err "Backend did not start within 30 seconds. Check $LOG_DIR/backend.log"
  return 1
}

# ── Credentials display ───────────────────────────────────────────────────────
show_credentials() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${WHITE}              Admin Login Credentials                 ${BLUE}║${NC}"
  echo -e "${BLUE}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${BLUE}║${NC}   Username : ${GREEN}admin${NC}                                      ${BLUE}║${NC}"
  echo -e "${BLUE}║${NC}   Password : ${RED}EagleAdmin2024!${NC}                              ${BLUE}║${NC}"
  echo -e "${BLUE}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${BLUE}║${WHITE}               Application URLs                        ${BLUE}║${NC}"
  echo -e "${BLUE}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${BLUE}║${NC}   Frontend  : ${GREEN}http://localhost:5173${NC}                    ${BLUE}║${NC}"
  echo -e "${BLUE}║${NC}   Backend   : ${GREEN}http://localhost:8000${NC}                    ${BLUE}║${NC}"
  echo -e "${BLUE}║${NC}   API Docs  : ${GREEN}http://localhost:8000/api/docs${NC}           ${BLUE}║${NC}"
  echo -e "${BLUE}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${BLUE}║${WHITE}   To stop:  kill \$(cat logs/backend.pid)             ${WHITE}            ${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}             kill \$(cat logs/frontend.pid)             ${WHITE}           ${BLUE}║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
  echo ""
}

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  step "Shutting down Eagle Game Engine 2D …"
  if [[ -f "$LOG_DIR/backend.pid" ]]; then
    BPID=$(cat "$LOG_DIR/backend.pid")
    kill "$BPID" 2>/dev/null && ok "Backend stopped (PID $BPID)" || true
    rm -f "$LOG_DIR/backend.pid"
  fi
  if [[ -f "$LOG_DIR/frontend.pid" ]]; then
    FPID=$(cat "$LOG_DIR/frontend.pid")
    kill "$FPID" 2>/dev/null && ok "Frontend stopped (PID $FPID)" || true
    rm -f "$LOG_DIR/frontend.pid"
  fi
  ok "Goodbye!"
}

trap cleanup EXIT INT TERM

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  banner
  check_prereqs
  setup_backend
  setup_frontend
  launch_backend
  launch_frontend
  wait_for_backend
  show_credentials

  # Keep script alive; tail logs to terminal
  echo -e "${WHITE}── Live logs (Ctrl+C to quit) ────────────────────────────${NC}"
  tail -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" &
  TAIL_PID=$!
  wait $TAIL_PID 2>/dev/null || true
}

main "$@"

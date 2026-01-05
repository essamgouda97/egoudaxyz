#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}Starting development environment...${NC}"

# Check dependencies
check_deps() {
    local missing=()

    if ! command -v uv &> /dev/null; then
        missing+=("uv (https://docs.astral.sh/uv/)")
    fi

    if ! command -v npm &> /dev/null; then
        missing+=("npm (install Node.js from https://nodejs.org/)")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}Missing dependencies:${NC}"
        for dep in "${missing[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# Install dependencies if needed
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"

    # Frontend
    cd "$PROJECT_ROOT"
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    # Backend
    cd "$PROJECT_ROOT/backend"
    if [ ! -d ".venv" ]; then
        echo "Installing backend dependencies..."
        uv sync
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

check_deps
install_deps

# Start backend
echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
cd "$PROJECT_ROOT/backend"
LOCAL=true LOGFIRE_TOKEN="${PYDANTIC_LOGFIRE_KEY_EGOUDAXYZ:-}" uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}Development servers started!${NC}"
echo -e "  Frontend:  http://localhost:5173"
echo -e "  Dashboard: http://localhost:5173/dashboard"
echo -e "  Backend:   http://localhost:8000"
echo -e "  API Docs:  http://localhost:8000/docs"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for both processes
wait

#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"

usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  apply         Create infrastructure"
    echo "  setup         First-time server setup (after apply)"
    echo "  deploy        Build locally and deploy to server"
    echo "  ssh           SSH into the server"
    echo "  logs          View container logs"
    echo "  status        Check deployment status"
    echo "  destroy       Destroy infrastructure"
    echo ""
    exit 1
}

check_terraform() {
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Terraform not found. Install from https://terraform.io${NC}"
        exit 1
    fi
}

get_server_ip() {
    cd "$INFRA_DIR/terraform"
    terraform output -raw droplet_ip 2>/dev/null || echo ""
}

terraform_init() {
    cd "$INFRA_DIR/terraform"

    [ -n "$DO_TOKEN" ] && export TF_VAR_do_token="$DO_TOKEN"

    if [ -z "$TF_VAR_ssh_public_key" ]; then
        for keyfile in ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub; do
            if [ -f "$keyfile" ]; then
                export TF_VAR_ssh_public_key="$(cat $keyfile)"
                break
            fi
        done
    fi

    if [ -z "$TF_VAR_do_token" ] && [ ! -f terraform.tfvars ]; then
        echo -e "${RED}Missing DO_TOKEN${NC}"
        echo -e "Add to ~/.zshrc: export DO_TOKEN=\"dop_v1_xxx\""
        exit 1
    fi

    terraform init -input=false
}

terraform_apply() {
    check_terraform
    echo -e "${GREEN}Creating infrastructure...${NC}"
    terraform_init

    cd "$INFRA_DIR/terraform"
    terraform apply

    echo -e "\n${GREEN}Infrastructure ready!${NC}"
    echo -e "Server IP: $(terraform output -raw droplet_ip)"
    echo -e "\n${YELLOW}Add this A record in Cloudflare:${NC}"
    terraform output -raw cloudflare_dns_record
    echo -e "\n\nRun '${YELLOW}$0 setup${NC}' to configure the server"
}

terraform_destroy() {
    check_terraform
    terraform_init
    cd "$INFRA_DIR/terraform"
    echo -e "${RED}WARNING: This will destroy ALL infrastructure!${NC}"
    terraform destroy
}

DOCKERHUB_REPO="essamgouda/egoudaxyz"

# First-time server setup
setup_server() {
    SERVER_IP=$(get_server_ip)

    if [ -z "$SERVER_IP" ]; then
        echo -e "${RED}No server found. Run 'deploy.sh apply' first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Setting up server at $SERVER_IP...${NC}"

    # Wait for SSH to be available
    echo "Waiting for SSH..."
    for i in {1..30}; do
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$SERVER_IP "echo ok" &>/dev/null; then
            echo -e "${GREEN}SSH ready!${NC}"
            break
        fi
        echo "  Waiting... ($i/30)"
        sleep 5
    done

    # Wait for apt locks (unattended-upgrades on fresh droplets)
    echo -e "${YELLOW}Waiting for apt locks...${NC}"
    ssh root@$SERVER_IP "while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do echo 'Waiting for apt lock...'; sleep 5; done"

    # Install dependencies on server
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    ssh root@$SERVER_IP "apt-get update && apt-get install -y docker-compose-plugin curl"

    # Install Caddy
    ssh root@$SERVER_IP "apt-get install -y debian-keyring debian-archive-keyring apt-transport-https && \
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
        apt-get update && apt-get install -y caddy"

    # Open firewall ports
    echo -e "${YELLOW}Configuring firewall...${NC}"
    ssh root@$SERVER_IP "ufw allow 80/tcp && ufw allow 443/tcp"

    # Generate/update .env from local environment
    echo -e "${YELLOW}Syncing environment variables...${NC}"

    # Preserve existing postgres password from server, or generate new one for first-time setup
    PG_PASS=$(ssh root@$SERVER_IP "grep '^POSTGRES_PASSWORD=' /opt/app/infra/docker/.env 2>/dev/null | cut -d= -f2-" || echo "")
    if [ -z "$PG_PASS" ]; then
        echo -e "${YELLOW}First-time setup, generating new POSTGRES_PASSWORD...${NC}"
        PG_PASS=$(openssl rand -base64 24)
    else
        echo -e "${GREEN}Preserving existing POSTGRES_PASSWORD from server${NC}"
    fi

    cat > "$INFRA_DIR/docker/.env" << ENVEOF
POSTGRES_PASSWORD=$PG_PASS
PYDANTIC_AI_GATEWAY_API_KEY=${PYDANTIC_AI_GATEWAY_API_KEY:-}
TAVILY_API_KEY=${TAVILY_API_KEY:-}
FINNHUB_API_KEY=${FINNHUB_API_KEY:-}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN:-}
LOGFIRE_TOKEN=${PYDANTIC_LOGFIRE_KEY_EGOUDAXYZ:-}
ORIGIN=https://egouda.xyz
PUBLIC_CONVEX_URL=${PUBLIC_CONVEX_URL:-}
PUBLIC_CONVEX_SITE_URL=${PUBLIC_CONVEX_SITE_URL:-}
AUTH_GITHUB_ID=${AUTH_GITHUB_ID:-}
AUTH_GITHUB_SECRET=${AUTH_GITHUB_SECRET:-}
ADMIN_EMAIL=${ADMIN_EMAIL:-}
ENVEOF

    # Create directories on server
    ssh root@$SERVER_IP "mkdir -p /opt/app/build /opt/app/infra/docker /var/log/caddy"

    # Copy configs
    echo -e "${YELLOW}Copying configs...${NC}"
    scp "$INFRA_DIR/docker/.env" root@$SERVER_IP:/opt/app/infra/docker/.env
    scp "$INFRA_DIR/docker/docker-compose.prod.yml" root@$SERVER_IP:/opt/app/infra/docker/docker-compose.yml
    scp "$INFRA_DIR/docker/Caddyfile" root@$SERVER_IP:/etc/caddy/Caddyfile

    # Pull images from Docker Hub and start services
    echo -e "${YELLOW}Pulling images and starting services...${NC}"
    ssh root@$SERVER_IP "cd /opt/app/infra/docker && docker compose pull && docker compose up -d"

    # Deploy Convex functions to production
    echo -e "${YELLOW}Deploying Convex functions...${NC}"
    cd "$PROJECT_ROOT"
    if [ -n "$CONVEX_DEPLOY_KEY" ]; then
        CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY" npx convex deploy -y
    else
        echo -e "${YELLOW}CONVEX_DEPLOY_KEY not set, skipping Convex deploy${NC}"
    fi

    # Start Caddy
    ssh root@$SERVER_IP "systemctl restart caddy"

    echo -e "${GREEN}Setup complete!${NC}"
    echo -e "Site: https://egouda.xyz"
    echo -e "${YELLOW}Note: Watchtower will auto-update containers when new images are pushed to Docker Hub${NC}"
}

# Deploy (build locally, push to server)
deploy_app() {
    SERVER_IP=$(get_server_ip)

    if [ -z "$SERVER_IP" ]; then
        echo -e "${RED}No server found.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Deploying to $SERVER_IP...${NC}"

    # Sync env vars - preserve existing postgres password from SERVER
    echo -e "${YELLOW}Syncing environment variables...${NC}"
    PG_PASS=$(ssh root@$SERVER_IP "grep '^POSTGRES_PASSWORD=' /opt/app/infra/docker/.env 2>/dev/null | cut -d= -f2-" || echo "")
    if [ -z "$PG_PASS" ]; then
        echo -e "${YELLOW}No existing password on server, generating new one...${NC}"
        PG_PASS=$(openssl rand -base64 24)
    else
        echo -e "${GREEN}Preserving existing POSTGRES_PASSWORD from server${NC}"
    fi

    cat > "$INFRA_DIR/docker/.env" << ENVEOF
POSTGRES_PASSWORD=$PG_PASS
PYDANTIC_AI_GATEWAY_API_KEY=${PYDANTIC_AI_GATEWAY_API_KEY:-}
TAVILY_API_KEY=${TAVILY_API_KEY:-}
FINNHUB_API_KEY=${FINNHUB_API_KEY:-}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN:-}
LOGFIRE_TOKEN=${PYDANTIC_LOGFIRE_KEY_EGOUDAXYZ:-}
ORIGIN=https://egouda.xyz
PUBLIC_CONVEX_URL=${PUBLIC_CONVEX_URL:-}
PUBLIC_CONVEX_SITE_URL=${PUBLIC_CONVEX_SITE_URL:-}
AUTH_GITHUB_ID=${AUTH_GITHUB_ID:-}
AUTH_GITHUB_SECRET=${AUTH_GITHUB_SECRET:-}
ADMIN_EMAIL=${ADMIN_EMAIL:-}
ENVEOF

    scp "$INFRA_DIR/docker/.env" root@$SERVER_IP:/opt/app/infra/docker/.env
    scp "$INFRA_DIR/docker/docker-compose.prod.yml" root@$SERVER_IP:/opt/app/infra/docker/docker-compose.yml

    # Deploy Convex functions to production
    echo -e "${YELLOW}Deploying Convex functions...${NC}"
    cd "$PROJECT_ROOT"
    if [ -z "$CONVEX_DEPLOY_KEY" ]; then
        echo -e "${RED}CONVEX_DEPLOY_KEY not set. Get it from Convex dashboard → Settings → Deploy Key${NC}"
        exit 1
    fi
    CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY" npx convex deploy -y

    # Pull latest images from Docker Hub and restart
    echo -e "${YELLOW}Pulling latest images and restarting services...${NC}"
    ssh root@$SERVER_IP "cd /opt/app/infra/docker && docker compose pull && docker compose up -d && docker image prune -f"

    echo -e "${GREEN}Deployment complete!${NC}"
}

ssh_server() {
    SERVER_IP=$(get_server_ip)
    [ -z "$SERVER_IP" ] && echo -e "${RED}No server found.${NC}" && exit 1
    ssh root@$SERVER_IP
}

view_logs() {
    SERVER_IP=$(get_server_ip)
    [ -z "$SERVER_IP" ] && echo -e "${RED}No server found.${NC}" && exit 1
    ssh root@$SERVER_IP "cd /opt/app/infra/docker && docker compose logs -f"
}

check_status() {
    SERVER_IP=$(get_server_ip)
    [ -z "$SERVER_IP" ] && echo -e "${RED}No server found.${NC}" && exit 1

    echo -e "${GREEN}Server: $SERVER_IP${NC}"
    echo ""
    ssh root@$SERVER_IP "cd /opt/app/infra/docker && docker compose ps" 2>/dev/null || echo "No containers"
}

case "${1:-}" in
    apply)   terraform_apply ;;
    setup)   setup_server ;;
    deploy)  deploy_app ;;
    ssh)     ssh_server ;;
    logs)    view_logs ;;
    status)  check_status ;;
    destroy) terraform_destroy ;;
    *)       usage ;;
esac

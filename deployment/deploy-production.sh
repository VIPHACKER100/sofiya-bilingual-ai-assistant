#!/bin/bash
# SOFIYA - Deploy to production
set -e

cd "$(dirname "$0")/.."
echo "==> Deploying SOFIYA to production..."

# Ensure .env is configured
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env not found. Copy from .env.example and configure."
  exit 1
fi

# Build with production flags
docker compose -f deployment/docker-compose.yml build --no-cache

# Tag for registry (update with your registry)
# docker tag sofiya-backend:latest your-registry/sofiya-backend:latest
# docker push your-registry/sofiya-backend:latest

# Production: use docker stack or kubectl
# docker stack deploy -c deployment/docker-compose.prod.yml sofiya

echo "==> Production build complete. Run your orchestrator to deploy."

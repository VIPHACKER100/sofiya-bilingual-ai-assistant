#!/bin/bash
# SOFIYA - Deploy to staging
set -e

cd "$(dirname "$0")/.."
echo "==> Deploying SOFIYA to staging..."

# Build images
docker compose -f deployment/docker-compose.yml build

# Run migrations (if any)
# docker compose exec backend npm run migrate

# Restart services
docker compose -f deployment/docker-compose.yml up -d

echo "==> Staging deployment complete."
echo "    Backend: http://localhost:3001"
echo "    Frontend: http://localhost:5173"

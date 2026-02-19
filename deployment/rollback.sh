#!/bin/bash
# SOFIYA - Rollback to previous deployment
set -e

cd "$(dirname "$0")/.."
echo "==> Rolling back SOFIYA..."

# Stop current containers
docker compose -f deployment/docker-compose.yml down

# Restore previous image tag (example)
# docker pull your-registry/sofiya-backend:previous
# docker compose -f deployment/docker-compose.yml up -d

# Or: kubectl rollout undo deployment/sofiya-backend

echo "==> Rollback initiated. Verify services."

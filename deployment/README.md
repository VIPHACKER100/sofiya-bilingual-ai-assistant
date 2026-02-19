# SOFIYA Deployment Guide

## Local Development (Docker Compose)

```bash
# From project root
docker compose -f deployment/docker-compose.yml up -d

# Services
# - Backend:  http://localhost:3001
# - Frontend: http://localhost:5173
# - Postgres: localhost:5432
# - Redis:    localhost:6379
```

## Staging

```bash
./deployment/deploy-staging.sh
```

## Production

1. Configure `backend/.env` and `voice-engine/.env`
2. Run: `./deployment/deploy-production.sh`
3. Push images to your registry
4. Deploy via Kubernetes or your orchestrator

## Rollback

```bash
./deployment/rollback.sh
```

## Kubernetes

```bash
kubectl apply -f deployment/kubernetes/
```

Create secrets:
```bash
kubectl create secret generic sofiya-secrets --from-env-file=backend/.env
```

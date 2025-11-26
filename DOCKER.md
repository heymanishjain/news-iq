# Docker Setup Guide for NewsIQ

This guide provides detailed instructions for running NewsIQ using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- OpenAI API key (required for RAG functionality)
- Optional: NewsAPI key for additional news sources

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url> news-iq
cd news-iq
```

### 2. Configure Environment

```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit backend/.env and add your API keys
# Required: OPENAI_API_KEY
# Optional: NEWS_API_KEY
```

### 3. Start Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Run Initial Ingestion

```bash
# Run ingestion to populate database and vector store
docker-compose exec backend python ingest.py

# Or use the helper script
./scripts/docker-ingest.sh
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## Docker Compose Files

### Production (`docker-compose.yml`)

Optimized for production with:
- Multi-stage builds
- Optimized image sizes
- Health checks
- Volume persistence
- Network isolation

### Development (`docker-compose.dev.yml`)

Optimized for development with:
- Hot reload for both services
- Source code mounted as volumes
- Development-friendly configurations

## Common Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service-name]

# Rebuild after code changes
docker-compose up -d --build
```

### Data Management

```bash
# Run ingestion
docker-compose exec backend python ingest.py

# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# View database (if needed)
docker-compose exec backend sqlite3 data/news_iq.db
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Data Persistence

### Volumes

Data is persisted in Docker volumes:
- `backend-data`: Contains SQLite database and Chroma vector store

### Backup

```bash
# Backup data volume
docker run --rm \
  -v newsiq_backend-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/newsiq-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore

```bash
# Restore from backup
docker run --rm \
  -v newsiq_backend-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/newsiq-backup-YYYYMMDD.tar.gz -C /
```

## Environment Variables

### Backend

Set in `backend/.env` or via docker-compose environment:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes (for RAG) | - | OpenAI API key |
| `NEWS_API_KEY` | No | - | NewsAPI key for additional sources |
| `DATABASE_URL` | No | `sqlite:///./data/news_iq.db` | Database connection string |
| `VECTOR_STORE_DIR` | No | `./data/storage/vector_store` | Vector store directory |
| `CHUNK_SIZE` | No | `600` | Text chunk size for embeddings |
| `CHUNK_OVERLAP` | No | `120` | Chunk overlap size |
| `HACKER_NEWS_LIMIT` | No | `30` | Number of HN stories to fetch |

### Frontend

Set via docker-compose environment:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | Backend API URL |

## Development Workflow

### Using Development Compose

```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# In another terminal, make code changes
# Both backend and frontend will auto-reload
```

### Making Code Changes

1. **Backend changes**: Edit files in `backend/` - changes reflect immediately with hot reload
2. **Frontend changes**: Edit files in `frontend/` - Next.js will rebuild automatically
3. **Dependency changes**: Rebuild containers:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep OPENAI

# Check database permissions
docker-compose exec backend ls -la data/
```

### Frontend can't connect to backend

1. Verify backend is running: `docker-compose ps`
2. Check CORS settings in `backend/app/main.py`
3. Verify `NEXT_PUBLIC_API_BASE_URL` is correct
4. Check network connectivity: `docker-compose exec frontend ping backend`

### Ingestion fails

```bash
# Check OpenAI API key
docker-compose exec backend env | grep OPENAI_API_KEY

# Run ingestion with verbose output
docker-compose exec backend python ingest.py

# Check database
docker-compose exec backend sqlite3 data/news_iq.db ".tables"
```

### Port conflicts

If ports 3000 or 8000 are already in use:

```yaml
# Edit docker-compose.yml
services:
  backend:
    ports:
      - "8001:8000"  # Change host port
  frontend:
    ports:
      - "3001:3000"  # Change host port
```

### Out of disk space

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove old volumes (⚠️ deletes data)
docker volume prune
```

## Production Deployment

### Build for Production

```bash
# Build production images
docker-compose build

# Tag for registry (optional)
docker tag newsiq-backend:latest your-registry/newsiq-backend:latest
docker tag newsiq-frontend:latest your-registry/newsiq-frontend:latest
```

### Environment Setup

1. Set production environment variables
2. Use secrets management (Docker secrets, AWS Secrets Manager, etc.)
3. Configure proper CORS origins
4. Set up reverse proxy (nginx, traefik)
5. Enable HTTPS

### Scaling

```bash
# Scale backend (if using load balancer)
docker-compose up -d --scale backend=3
```

## Network Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ http://localhost:3000
       │
┌──────▼──────┐      ┌──────────────┐
│  Frontend   │──────│   Backend    │
│  (Next.js)  │      │  (FastAPI)   │
│  Port 3000  │      │  Port 8000   │
└─────────────┘      └──────┬───────┘
                            │
                    ┌───────▼────────┐
                    │  Docker Volume  │
                    │  (backend-data) │
                    │  - SQLite DB    │
                    │  - Vector Store │
                    └─────────────────┘
```

## Security Considerations

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use Docker secrets** for production API keys
3. **Limit CORS origins** in production
4. **Use HTTPS** in production
5. **Regular backups** of data volumes
6. **Keep images updated** - Regularly rebuild with latest base images

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)


# NewsIQ – RAG-Powered News Intelligence

NewsIQ is a full-stack MVP that ingests technology and sports news, stores the content in SQLite plus a Chroma vector store, and exposes a FastAPI backend and a Next.js frontend. Users can browse the latest feed, filter by category/date, and ask natural language questions that are answered by an OpenAI-powered Retrieval Augmented Generation (RAG) pipeline.

## Architecture

```
                             +-------------------------+
                             |    docker-compose /     |
                             |    local dev scripts    |
                             +-----------+-------------+
                                         |
+-----------------+    +---------------------+    +-----------------+
| Hacker News API |    |    RSS Feeds        |    |    NewsAPI      |
| (technology)    |    | (Ars, ESPN, The     |    | (multi-category |
+--------+--------+    |  Hindu, Indian Exp) |    |  headlines)     |
         |             +----------+----------+    +--------+--------+
         |                        |                         |
         +-----------[ Ingestion Services ]-----------------+
                              |
                              v
                     [ SQLite (articles + image_url) ]
                              |
                     [ Chroma Vector Store ]
                              ^
                              |
                         OpenAI Embeddings
                              |
                              v
                      +---------------+
                      | FastAPI + RAG |
                      |  (REST + SSE) |
                      +-------+-------+
                              |
                              v
         +-----------------------------------------------+
         |            Next.js + Tailwind UI              |
         |-----------------------------------------------|
         |  /news feed (Google News layout, filters)     |
         |  /ask-news-iq (ChatPanel + localStorage)      |
         |  Responsive navigation + dark/light mode      |
         +-----------------------------------------------+
```

## Backend Setup (FastAPI)

1. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Copy and edit the environment file:
   ```bash
   cp ../.env.example ../.env
   ```
   Set `OPENAI_API_KEY` and optional overrides for `DATABASE_URL` / `VECTOR_STORE_DIR`.
3. Run the ingestion pipeline:
   ```bash
   python ingest.py
   ```
4. Start the API server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Frontend Setup (Next.js)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Configure the backend URL if needed:
   ```bash
   export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Docker Setup (Recommended)

> **📖 For detailed Docker instructions, see [DOCKER.md](./DOCKER.md)**

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key (required for RAG functionality)

### Quick Start with Docker

1. **Set up environment variables:**
   ```bash
   # Create backend .env file
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your OPENAI_API_KEY
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Run initial ingestion:**
   ```bash
   docker-compose exec backend python ingest.py
   ```
   Or use the helper script:
   ```bash
   ./scripts/docker-ingest.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Health: http://localhost:8000/health

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Run ingestion
docker-compose exec backend python ingest.py

# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Development Mode with Hot Reload

For development with hot reload:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up
```

This will:
- Enable hot reload for both backend and frontend
- Mount source code as volumes
- Use development Dockerfiles

### Production Deployment

For production, use the standard `docker-compose.yml`:

```bash
# Build production images
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Data Persistence

- Database and vector store data are persisted in Docker volumes
- Data location: `backend-data` volume
- To backup: `docker run --rm -v newsiq_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data`
- To restore: `docker run --rm -v newsiq_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /`

## API Reference

### `GET /health`
Simple health probe returning `{ "status": "ok" }`.

### `GET /api/news`
Query params: `q`, `category`, `source`, `date_from`, `date_to`, `page`, `page_size`. Returns a paginated `ArticleListResponse` with metadata and article payloads.

### `GET /api/news/{id}`
Fetch a single article for the detail view.

### `POST /api/query`
Body:
```json
{
  "question": "string",
  "filters": {
    "category": "technology",
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-01-31T23:59:59Z"
  }
}
```
Response:
```json
{
  "answer": "Final LLM answer",
  "articles": [
    {
      "id": 1,
      "title": "...",
      "source": "...",
      "url": "...",
      "published_at": "...",
      "category": "..."
    }
  ]
}
```

### `POST /api/admin/refresh`
Runs the ingestion pipeline asynchronously. Useful for manual refreshes from the UI or automation.

## RAG Flow

1. **Ingestion**: Hacker News + RSS feeds → cleaned text in SQLite + chunked embeddings in Chroma.
2. **Retrieval**: Question is embedded (`text-embedding-3-small`) and matched with top 8 chunks filtered by category/date.
3. **Prompt Building**: Context entries include title, source, date, and snippet.
4. **Generation**: `gpt-4.1-mini` receives the system/user prompt and returns a factual answer citing sources.
5. **Response**: API returns the answer plus structured article metadata for UI display.

## Running the Demo End-to-End

1. Start FastAPI on port 8000 (ensure `.env` is configured) and run `python ingest.py` for seed data.
2. Start the Next.js app on port 3000 and browse to `http://localhost:3000`.
3. Use the filters to explore the feed, then ask questions in the Q&A panel. Source links open the original articles.

## Testing

Run backend tests with:
```bash
cd backend
pytest
```
Tests cover health, news listing, and query response structure (with a mocked RAG service).

## Future Improvements

- Stream ingestion via scheduled jobs or message queues.
- Add user auth plus personalization.
- Support more categories and multilingual feeds.
- Display ingestion status and vector-store health in the UI.
- Add caching and analytics dashboards for queries.

# NewsIQ – RAG-Powered News Intelligence

NewsIQ is a full-stack MVP that ingests technology and sports news, stores the content in SQLite plus a Chroma vector store, and exposes a FastAPI backend and a Next.js frontend. Users can browse the latest feed, filter by category/date, and ask natural language questions that are answered by an OpenAI-powered Retrieval Augmented Generation (RAG) pipeline.

## Project Overview & Approach

NewsIQ was built to demonstrate a production-ready RAG (Retrieval Augmented Generation) system that combines multiple news sources into a unified, queryable knowledge base. The project follows a modular, service-oriented architecture that separates concerns between data ingestion, storage, retrieval, and presentation.

### Core Approach

1. **Multi-Source Ingestion**: The system aggregates news from diverse sources (Hacker News API, RSS feeds from Ars Technica, ESPN, The Hindu, The Indian Express, and NewsAPI) using dedicated ingestor classes. Each ingestor normalizes data into a common schema, ensuring consistent article metadata, content, and image URLs.

2. **Hybrid Storage Strategy**: Articles are stored in two complementary systems:
   - **SQLite** for structured metadata (title, source, URL, category, timestamps, image URLs) enabling fast filtering and pagination
   - **ChromaDB** for vector embeddings of article chunks, enabling semantic search and retrieval

3. **RAG Pipeline**: When users ask questions, the system:
   - Embeds the query using OpenAI's `text-embedding-3-small` model
   - Performs similarity search in ChromaDB with optional category/date filters
   - Retrieves top-k relevant chunks and their source articles
   - Constructs a context-rich prompt for the LLM
   - Generates answers using `gpt-4o-mini` with source citations

4. **Modern Frontend**: A responsive Next.js application with:
   - Google News-inspired feed layout with thumbnails and date grouping
   - Real-time chat interface with Server-Sent Events (SSE) for streaming responses
   - Client-side persistence using localStorage for chat history
   - Full dark/light mode support and mobile-first responsive design

5. **Developer Experience**: Docker Compose setup enables one-command deployment, with separate development and production configurations, hot reload support, and persistent data volumes.

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

## Architecture Decisions

### Database: SQLite vs PostgreSQL
**Decision**: SQLite for MVP  
**Rationale**: 
- Zero-configuration database perfect for MVP and single-instance deployments
- File-based storage simplifies Docker volume management
- Sufficient performance for read-heavy workloads with proper indexing
- Easy backup/restore (single file)
- Can migrate to PostgreSQL later if scaling requires it

### Vector Store: ChromaDB vs Pinecone/Weaviate
**Decision**: ChromaDB (local persistent)  
**Rationale**:
- Open-source and self-hosted, avoiding vendor lock-in
- Persistent storage on disk (no separate service needed)
- Simple Python API that integrates seamlessly with FastAPI
- Supports metadata filtering (category, date ranges) out of the box
- No external service dependencies or API costs for storage

### Backend Framework: FastAPI vs Flask/Django
**Decision**: FastAPI  
**Rationale**:
- Automatic OpenAPI/Swagger documentation
- Built-in async support for SSE streaming
- Type safety with Pydantic models
- High performance (comparable to Node.js/Go)
- Modern Python features (type hints, async/await)
- Excellent developer experience with auto-completion

### Frontend Framework: Next.js vs React/Vue
**Decision**: Next.js 14 (App Router)  
**Rationale**:
- Server-side rendering and static generation capabilities
- Built-in API routes (though we use FastAPI)
- Excellent TypeScript support
- Image optimization (though disabled for external images)
- File-based routing with App Router
- Strong ecosystem and community

### Styling: Tailwind CSS vs CSS Modules/Styled Components
**Decision**: Tailwind CSS  
**Rationale**:
- Rapid UI development with utility classes
- Consistent design system with custom color palette
- Small production bundle size with purging
- Easy dark mode implementation
- Responsive design utilities built-in

### RAG Approach: RAG vs Fine-Tuning
**Decision**: RAG (Retrieval Augmented Generation)  
**Rationale**:
- No need to retrain models when news content changes
- Can cite specific sources (transparency)
- Lower cost (no fine-tuning expenses)
- Works with any LLM (model-agnostic)
- Easy to update knowledge base by re-ingesting articles
- Better for factual, time-sensitive content

### Chat Persistence: localStorage vs Backend Database
**Decision**: localStorage (client-side)  
**Rationale**:
- No authentication required for MVP
- Zero backend storage costs
- Instant access (no API calls)
- Privacy-friendly (data stays on client)
- Simple implementation
- Can migrate to backend later when adding auth

### Image Handling: Next.js Image vs Standard img
**Decision**: Next.js Image component with `unoptimized: true`  
**Rationale**:
- External images from various domains (can't pre-configure all)
- Disable optimization to avoid CORS/domain issues
- Still get lazy loading and responsive sizing benefits
- Fallback handling for missing images

### Deployment: Docker Compose vs Kubernetes/Cloud
**Decision**: Docker Compose  
**Rationale**:
- Single-command setup for local development and production
- No cloud vendor lock-in
- Easy to understand and modify
- Suitable for MVP and small-to-medium deployments
- Can containerize for cloud platforms later

## Technologies Used and Justification

### Backend Stack

| Technology | Version | Justification |
|------------|---------|---------------|
| **Python 3.11+** | Latest | Modern language with excellent AI/ML ecosystem, async support |
| **FastAPI** | 0.122.0 | High-performance async framework with automatic API docs, type safety |
| **Uvicorn** | 0.29.0 | ASGI server optimized for FastAPI, supports hot reload in development |
| **SQLAlchemy** | 2.0.23 | Mature ORM with excellent SQLite support, type hints, async capabilities |
| **Pydantic** | 2.12.4 | Data validation and serialization, ensures type safety across API boundaries |
| **Pydantic Settings** | 2.1.0 | Environment variable management with validation, `.env` file support |
| **SQLite** | Built-in | Zero-config database, perfect for MVP, file-based persistence |
| **ChromaDB** | 0.4.22 | Open-source vector database, persistent storage, metadata filtering |
| **OpenAI SDK** | 1.3.5 | Official SDK for embeddings (`text-embedding-3-small`) and chat (`gpt-4o-mini`) |
| **Requests** | 2.31.0 | Simple HTTP client for fetching news from APIs and RSS feeds |
| **Feedparser** | 6.0.11 | Robust RSS/Atom feed parser, handles various feed formats |
| **Pytest** | 7.4.4 | Industry-standard Python testing framework |

### Frontend Stack

| Technology | Version | Justification |
|------------|---------|---------------|
| **Next.js** | 14.0.4 | React framework with SSR, App Router, excellent DX, production-ready |
| **React** | 18.2.0 | Mature UI library with hooks, context API, large ecosystem |
| **TypeScript** | 5.2.2 | Type safety, better IDE support, catches errors at compile time |
| **Tailwind CSS** | 3.3.5 | Utility-first CSS, rapid development, small bundle size |
| **Framer Motion** | 12.23.24 | Smooth animations and transitions, declarative API |
| **React Markdown** | 10.1.0 | Renders markdown in chat responses, supports plugins |
| **Remark GFM** | 4.0.1 | GitHub Flavored Markdown support (tables, strikethrough, etc.) |
| **Rehype Raw** | 7.0.0 | Allows HTML in markdown (for citations and links) |

### DevOps & Tooling

| Technology | Justification |
|------------|---------------|
| **Docker** | Containerization for consistent environments, easy deployment |
| **Docker Compose** | Multi-container orchestration, service networking, volume management |
| **Git** | Version control, collaboration, deployment workflows |

### External Services

| Service | Purpose | Justification |
|---------|---------|---------------|
| **OpenAI API** | Embeddings & LLM | Industry-leading models, reliable API, cost-effective for MVP |
| **NewsAPI** | News headlines | Comprehensive news aggregation, free tier available |
| **Hacker News API** | Tech news | Public API, no authentication, high-quality tech content |
| **RSS Feeds** | News sources | Standard protocol, diverse sources (Ars, ESPN, The Hindu, etc.) |

### Why Not Alternatives?

- **PostgreSQL**: Overkill for MVP, adds complexity (separate service, migrations)
- **Pinecone/Weaviate**: Vendor lock-in, additional costs, external dependency
- **Flask**: Lacks async support, slower, no built-in API docs
- **Django**: Too heavyweight, opinionated structure, slower than FastAPI
- **Vue**: Smaller ecosystem than React, less TypeScript support
- **CSS-in-JS**: Larger bundle size, runtime overhead vs Tailwind
- **Fine-tuning**: Expensive, requires retraining, less flexible than RAG

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

## Challenges Faced and How You Solved Them

### 1. Image URL Extraction from RSS Feeds
**Challenge**: RSS feeds have inconsistent image metadata. Some use `media:content`, others use `og:image` meta tags, and some embed images in HTML content.

**Solution**: Implemented a multi-strategy extraction approach in `RSSIngestor`:
- First check `media_content` and `media_thumbnail` fields
- Parse HTML content for `<img>` tags
- Extract `og:image` meta tags from HTML
- Fallback to `None` if no image found (handled gracefully in frontend)

**Result**: Successfully extracts images from diverse RSS sources with appropriate fallbacks.

### 2. Database Schema Migration
**Challenge**: Adding `image_url` column to existing SQLite database without breaking existing data or requiring complex migration tools.

**Solution**: Created a standalone migration script (`migrate_add_image_url.py`) that:
- Directly uses `sqlite3` to avoid import issues
- Performs `ALTER TABLE` to add nullable column
- Safe to run multiple times (checks if column exists)
- No dependencies on app code

**Result**: Zero-downtime migration, existing articles remain intact, new articles get image URLs.

### 3. UI Flickering in Filter Section
**Challenge**: Auto-collapse/expand behavior based on scroll position caused continuous flickering when scrolling near threshold.

**Solution**: Simplified UX by removing scroll-based auto-toggling:
- Filters collapsed by default
- Only expand/collapse on explicit button click
- Removed all scroll event listeners for filter visibility
- Cleaner, more predictable user experience

**Result**: Eliminated flickering completely, users have full control over filter visibility.

### 4. Next.js Image Optimization for External Domains
**Challenge**: Next.js Image component requires pre-configured domains, but news articles come from hundreds of different domains.

**Solution**: 
- Configured `remotePatterns` to allow all external domains
- Set `unoptimized: true` to disable Next.js optimization
- Still use Image component for lazy loading and responsive sizing
- Implemented fallback UI for missing/broken images

**Result**: Images load from any source while maintaining good UX with fallbacks.

### 5. Docker Volume Persistence
**Challenge**: Ensuring SQLite database and ChromaDB vector store persist across container restarts.

**Solution**: 
- Created named Docker volume `backend-data`
- Mounted to `/app/data` in container
- Configured `DATABASE_URL` and `VECTOR_STORE_DIR` to use `/app/data`
- Documented backup/restore procedures

**Result**: Data persists reliably, easy to backup and restore.

### 6. CORS Configuration for Docker Networking
**Challenge**: Frontend and backend communicate differently in Docker (internal hostnames) vs local development (localhost).

**Solution**: Updated CORS `allowed_origins` in FastAPI to include:
- `http://localhost:3000` (local dev)
- `http://frontend:3000` (Docker internal networking)
- Environment-based configuration support

**Result**: Works seamlessly in both local and Docker environments.

### 7. Chat History Persistence Without Backend
**Challenge**: Storing chat history without authentication or backend database.

**Solution**: Implemented `localStorage` persistence in `ChatPanel`:
- Auto-save messages after each exchange
- Auto-load on component mount
- Clear button with confirmation dialog
- JSON serialization/deserialization
- Handles localStorage errors gracefully

**Result**: Chat history persists across sessions without any backend complexity.

### 8. RSS Feed Parsing Edge Cases
**Challenge**: Different RSS feeds have varying structures, date formats, and content encodings.

**Solution**: 
- Used `feedparser` library (handles various RSS/Atom formats)
- Robust date parsing with fallbacks
- HTML content cleaning and sanitization
- Try/except blocks around parsing operations
- Logging for debugging problematic feeds

**Result**: Successfully ingests from diverse sources (Ars Technica, ESPN, The Hindu, The Indian Express).

### 9. RAG Response Streaming
**Challenge**: Providing real-time streaming responses for better UX without blocking the API.

**Solution**: 
- Implemented Server-Sent Events (SSE) endpoint `/api/query/stream`
- Used FastAPI's `StreamingResponse` with generator
- OpenAI streaming API integration
- Frontend `EventSource` or `fetch` with streaming parser
- Graceful error handling and connection cleanup

**Result**: Users see responses stream in real-time, improving perceived performance.

### 10. Article Deduplication
**Challenge**: Same article may appear from multiple sources or be re-ingested.

**Solution**: 
- Use URL as unique identifier in `upsert_article`
- SQLAlchemy `merge()` operation updates existing or inserts new
- Prevents duplicate entries in both SQLite and ChromaDB
- Maintains data consistency

**Result**: Clean database without duplicates, efficient updates.

## Future Improvements

- Stream ingestion via scheduled jobs or message queues.
- Add user auth plus personalization.
- Support more categories and multilingual feeds.
- Display ingestion status and vector-store health in the UI.
- Add caching and analytics dashboards for queries.

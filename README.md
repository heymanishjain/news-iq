# NewsIQ – RAG-Powered News Intelligence

NewsIQ is a full-stack MVP that ingests technology and sports news, stores the content in SQLite plus a Chroma vector store, and exposes a FastAPI backend and a Next.js frontend. Users can browse the latest feed, filter by category/date, and ask natural language questions that are answered by an OpenAI-powered Retrieval Augmented Generation (RAG) pipeline.

## Architecture

```
+-----------------+      +------------------+      +-----------------+
| Hacker News API |      |  RSS Feeds       |      |  ingest.py CLI  |
+--------+--------+      +--------+---------+      +--------+--------+
         |                        |                         |
         v                        v                         v
  [Ingestors] ---> [SQLite Articles] ---> [Chroma Vector Store] <--- [Embeddings]
         |                        |                         ^
         v                        v                         |
   FastAPI REST API  <------>  RAG Service  <------>  OpenAI GPT-4.1-mini
         |
         v
  Next.js + Tailwind UI
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

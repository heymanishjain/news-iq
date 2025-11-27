# Project Architecture

## High-Level Flow
```
[Hacker News]  [RSS Feeds]  [NewsAPI]
        │            │            │
        └── ingestors (HN/RSS/NewsAPI) ──▶ SQLite (articles)
                               │
                               └── chunk_text + OpenAI embeddings ─▶ Chroma Vector Store
                                                       │
User ➜ Next.js (News feed, ChatPanel)
      │        │
      │        └──── fetch /api/news → SQLAlchemy → SQLite
      │
      └─ Ask NewsIQ → POST /api/query or /api/query/stream
                       │
                       ├─ RAGService: embed question via OpenAI
                       ├─ VectorStore.similarity_search (Chroma)
                       ├─ Build context & call OpenAI chat
                       └─ Return answer + articles via FastAPI (JSON/SSE)
```

## Backend Overview
- `app/main.py` wires FastAPI, CORS, static files, and startup hook that initializes `LLMClient`, `VectorStore`, and `RAGService`.
- Routers:
  - `routes_news` exposes paginated article listing and detail endpoints with SQLAlchemy filters.
  - `routes_query` provides synchronous and streaming RAG answers, wrapping generator output in Server-Sent Events.
  - `routes_admin` lets clients trigger ingestion asynchronously using FastAPI background tasks.
- Core utilities:
  - `core/config.py` loads `.env` using Pydantic settings and exposes cached `Settings`.
  - `core/db.py` defines SQLAlchemy engine/session factory and DI-friendly `get_db`.
- Services:
  - Ingestion pipeline (HackerNews/RSS/NewsAPI ingestors, `chunk_text`, `upsert_article`, `vector_store.add_chunks`) refreshes SQLite and Chroma.
  - `vector_store.py` maintains Chromadb persistent client and similarity_search with optional metadata filters (category/date range).
  - `llm_client.py` wraps OpenAI Chat & Embedding APIs, including streaming for SSE.
  - `rag_service.py` orchestrates embeddings, retrieval, prompt construction, call to OpenAI, and final article hydration from SQL.
- Schemas & models ensure type-safe IO: `Article*` Pydantic models, `Query*` payloads, SQLAlchemy `Article` table.

## Frontend Overview
- Next.js 14 App Router with pages:
  - `/` home hero linking to News feed and Ask NewsIQ with responsive card layouts.
  - `/news` client-side list with filters, search, animated skeleton, and Google News-inspired layout with article thumbnails and date grouping. Fully responsive with mobile-optimized grid.
  - `/ask-news-iq` uses `ChatPanel` for live SSE chat with citations and persistent chat history.
  - ~~`/articles/[id]`~~ Removed: Articles now redirect directly to their source URLs.
- Components:
  - `ChatPanel` handles message state, SSE streaming, abortable fetch, Markdown rendering (ReactMarkdown + remark-gfm + rehype-raw), article mapping for inline citations, localStorage persistence, and clear chat button.
  - `Navigation` includes mobile hamburger menu for responsive navigation.
  - `FiltersBar`, `SearchBar`, `AnimatedLoadingSkeleton`, `ThemeProvider`, `ThemeToggle`, etc. provide reusable UI with responsive design.
- Styling handled by Tailwind (custom `primary` color) plus global CSS font + dark mode toggling via context and `<html class="dark">`. Fully responsive across mobile, tablet, and desktop breakpoints.

## Folder Structure (condensed)
```
news-iq/
├── docs/ (README.md, PROJECT.md, PACKAGE.md, FILES.md)
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── ingest.py
│   ├── news_iq.db
│   └── storage/vector_store/
└── frontend/
    ├── app/
    ├── components/
    ├── styles/
    ├── next.config.mjs
    ├── tailwind.config.ts
    └── package.json
```

## Data Flow Details
### Ingestion Pipeline
1. `run_ingestion()` ensures DB schema, initializes optional `LLMClient`, `VectorStore`, and iterates through `HackerNewsIngestor`, `RSSIngestor`, `NewsAPIIngestor`.
2. Each ingestor returns `ArticleCreate` models with cleaned HTML content via `text_cleaning.clean_html` and extracted `image_url` (from RSS media_content, HTML img tags, or NewsAPI urlToImage).
3. `upsert_article` deduplicates by URL and refreshes SQLite rows, including `image_url` updates.
4. Text is chunked (`chunk_size=600`, `chunk_overlap=120`), embedded via OpenAI, then persisted to Chroma along with metadata (title/source/category/date/url/snippet).
5. RSS ingestor extracts images from `media_content`, `media_thumbnail`, HTML `<img>` tags, and Open Graph meta tags.

### Query / RAG Flow
1. `/api/query` receives question + optional filters; `RAGService.answer_question` embeds question, calls `VectorStore.similarity_search`, and builds context text.
2. The service invokes `LLMClient.generate_response` (or streaming variant) with a strict system prompt to cite excerpts only.
3. Article IDs are extracted from retrieved metadata, SQLAlchemy loads full records, and Pydantic serializes them back to clients.
4. Streaming variant yields incremental tokens and final article list + article-number mapping for UI.

## API & UI Workflow
- Article feed: Next.js constructs query string from local filter state, fetches `/api/news`, and renders cards with images, date grouping, and Google News-inspired layout. Animated skeleton shows while requests are pending. Articles link directly to source URLs.
- Ask NewsIQ: `ChatPanel` POSTs to `/api/query/stream`, decodes SSE chunks in real time, updates Markdown content, renders source list once `articles` arrive, and persists all messages to localStorage for retrieval on page reload.
- Admin refresh: POST `/api/admin/refresh` to enqueue ingestion without blocking HTTP response.

## State Management
- React hooks (`useState`, `useEffect`, `useMemo`) manage filters, search debouncing, chat messages, and streaming progress.
- Custom `useDebounce` function prevents excessive API calls while typing.
- Theme context stores preference in `localStorage` and applies class to `<html>`.
- Chat history persisted to `localStorage` with key `news_iq_chat_history`, automatically loaded on mount and saved on message changes.
- AbortController ensures only one SSE request is active.
- Mobile menu state managed in `Navigation` component for responsive hamburger menu.

## Reusable Components & Logic
- `FiltersBar` accepts `filters` object and `onChange` callback for partial updates. Responsive grid layout.
- `SearchBar` controls focus styling and placeholder hints. Responsive icon and text sizes.
- `AnimatedLoadingSkeleton` uses framer-motion to animate placeholder cards.
- `ChatPanel` includes quick-question buttons, streaming markdown renderer, citation rewriting (`processArticleReferences`), category dropdown, localStorage persistence, and clear chat button with confirmation.
- `Navigation` provides responsive hamburger menu for mobile devices, collapsing nav links on small screens.

## Build & Configuration
- Backend uses `.env` read by Pydantic; vector store directory auto-created via `vector_store_path`.
- Frontend build commands:
  - `npm run dev` for development server.
  - `npm run build` + `npm run start` for production.
  - `npm run lint` uses Next lint defaults.
- Tailwind compiled via PostCSS (autoprefixer) with content globs for `app/` and `components/`.
- Docker support: `docker-compose.yml` for production, `docker-compose.dev.yml` for development with hot-reload.
- Next.js image configuration allows external images via `remotePatterns` with `unoptimized: true` for external URLs.

## AuthN/AuthZ
- No authentication currently. CORS restricts to local origins; TODO for future: add auth tokens or session management before exposing publicly.

## Database & Storage
- SQLite (default) accessed through SQLAlchemy; `DATABASE_URL` can be overridden for Postgres/MySQL.
- Chroma persistent client stores vector data under `storage/vector_store`. Each chunk recorded with metadata enabling filter queries.
- `Article` model includes `image_url` column (VARCHAR(512), nullable) for storing article thumbnail URLs.
- Migration script `migrate_add_image_url.py` available for adding `image_url` to existing databases.

## Business Logic & Error Handling
- Deduplication by URL ensures repeated ingestion updates existing articles.
- Clean HTML removes tags and normalizes whitespace to improve embeddings/search.
- Query route streaming handles errors by emitting `{type:"error", message}` SSE event.
- Ingestion gracefully continues when HN/RSS/NewsAPI requests fail.
- FastAPI startup only instantiates RAGService when `OPENAI_API_KEY` exists (prevents runtime errors).

## Edge Cases & Resilience
- If similarity search returns no results, service responds with "No relevant articles found."
- SSE reader handles partial buffers and newline-separated events.
- Articles link directly to source URLs, ensuring users always reach original content.
- Image loading errors handled with fallback display showing category/source badges.
- Vector store path creation ensures directories exist before writes.
- localStorage chat history gracefully handles parse errors and missing data.
- Responsive design ensures usability across all screen sizes with mobile-first approach.

## End-to-End Summary
1. Run ingestion (cron or manual) to populate SQLite + Chroma.
2. FastAPI launches, loads config, initializes RAG components, and exposes REST/SSE endpoints.
3. Next.js frontend fetches data and renders responsive pages with Tailwind.
4. Users explore news, ask AI questions, and get cited answers referencing stored articles.
5. Admin refresh or ingestion job keeps corpus up to date; vector store persists between sessions.


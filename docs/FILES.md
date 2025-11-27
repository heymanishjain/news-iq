# File-by-File Reference

> Generated assets (databases, node_modules, chroma blobs, `__pycache__`, etc.) are omitted. Paths relative to repo root.

## Root
| Path | Purpose | Notes |
| --- | --- | --- |
| `README.md` | Original project overview (see `docs/README.md` for expanded version). | Informational. |
| `.env`, `.env.example` | Backend configuration loaded by Pydantic settings. | Defines DB URL, API keys, chunking params. |
| `backend/requirements.txt` | Python dependency list for backend. | Used by `pip install -r requirements.txt` (from `backend/` directory). |
| `docs/` | Generated documentation bundle. | Contains README/PROJECT/PACKAGE/FILES. |
| `backend/` | FastAPI API, ingestion pipeline, tests, persisted SQLite/Chroma. | Core server logic. |
| `frontend/` | Next.js UI (news feed + Ask NewsIQ). | React/Tailwind app. |

## Backend
| File | Purpose / Usage | Key Contents |
| --- | --- | --- |
| `backend/ingest.py` | CLI entrypoint for ingestion pipeline. | Imports and calls `run_ingestion()`. |
| `backend/news_iq.db` | SQLite DB storing ingested articles. | Accessed via SQLAlchemy engine. |
| `backend/storage/vector_store/*` | Chroma persistence (index, metadata). | Used by `VectorStore`. |

### `backend/app/main.py`
- Initializes FastAPI app with title from settings.
- Mounts static assets (`app/static`) when available.
- Configures CORS for localhost origins.
- Startup hook: creates DB tables, instantiates `LLMClient`, `VectorStore`, `RAGService`, storing service on `app.state`.
- Includes routers: news, query, admin; exposes `/health`.

### API Routers
| File | Role | Notable Functions |
| --- | --- | --- |
| `app/api/routes_news.py` | REST list/detail for articles. | `list_news` filters by `q`, category, source, dates; `get_article` returns single record or 404. |
| `app/api/routes_query.py` | Q&A endpoints (JSON + SSE). | `query_news` returns synchronous result, `query_news_stream` streams SSE chunks with `done` event. |
| `app/api/routes_admin.py` | Admin utilities. | `refresh_data` schedules ingestion in background. |

### Core Utilities
| File | Purpose |
| --- | --- |
| `app/core/config.py` | `Settings` class (Pydantic) reading `.env`, helper to ensure vector store directory exists. |
| `app/core/db.py` | SQLAlchemy engine, session factory, context manager, and FastAPI dependency `get_db()`. |

### Models & Schemas
| File | Description |
| --- | --- |
| `app/models/article.py` | SQLAlchemy `Article` table with title/source/url/published_at/category/content/image_url timestamps. |
| `app/schemas/article.py` | Pydantic models: `ArticleCreate`, `ArticleRead`, `ArticleListResponse`, `ArticleFilters`. |
| `app/schemas/query.py` | Query payloads (`QueryFilters`, `QueryRequest`) and response objects (`QueryArticle`, `QueryResponse`). |

### Services
| File | Purpose | Key Functions |
| --- | --- | --- |
| `app/services/rag_service.py` | RAG orchestrator. | `_build_context`, `answer_question`, `answer_question_stream`. |
| `app/services/vector_store.py` | Chroma wrapper. | `add_chunks`, `similarity_search` (supports metadata filtering). |
| `app/services/llm_client.py` | OpenAI client wrapper. | `embed_texts`, `generate_response`, `generate_response_stream`. |
| `app/services/ingestion/base_ingestor.py` | Abstract base for feed ingestors. | `fetch_articles()` signature. |
| `app/services/ingestion/hn_ingestor.py` | Pulls Hacker News top stories. | Requests API, cleans HTML, tags as technology, sets image_url to None. |
| `app/services/ingestion/rss_ingestor.py` | Fetches curated RSS feeds (Ars Technica, ESPN, The Hindu, The Indian Express). | Parses entries, extracts images from media_content/HTML, optional full-content fetch via `requests`. |
| `app/services/ingestion/newsapi_ingestor.py` | Queries NewsAPI for multiple categories. | Handles API key, category looping, timestamp parsing. |
| `app/services/ingestion/pipeline.py` | Shared ingestion logic. | `chunk_text`, `upsert_article`, `ingest_articles`, `run_ingestion`. |

### Utilities
| File | Purpose |
| --- | --- |
| `app/utils/text_cleaning.py` | Removes HTML tags & collapses whitespace for ingestion content. |

### Tests
| File | Purpose |
| --- | --- |
| `tests/test_health.py` | Ensures `/health` returns `{"status":"ok"}`. |
| `tests/test_news_api.py` | Validates listing endpoint and pagination structure (using SQLite test DB). |
| `tests/test_query_api.py` | Stubs RAG service to verify `/api/query` response shape. |
| `test_news.db`, `test_query.db` | SQLite DBs spawned for tests. |
| `conftest.py` | Adds backend path to `sys.path` for tests. |

## Frontend
| File | Purpose / Notes |
| --- | --- |
| `frontend/package.json` | npm scripts & dependency list (`dev`, `build`, `start`, `lint`). |
| `frontend/package-lock.json` | Lock file for reproducible installs. |
| `frontend/next.config.mjs` | Enables React strict mode, sets `NEXT_PUBLIC_API_BASE_URL` fallback. |
| `frontend/tailwind.config.ts` | Tailwind setup (dark mode, content globs, `primary` color). |
| `frontend/postcss.config.js` | Hooks Tailwind + Autoprefixer. |
| `frontend/tsconfig.json` | TypeScript compiler settings (strict mode, Next plugin). |
| `frontend/next-env.d.ts` | Ensures TypeScript includes Next types. |
| `frontend/styles/globals.css` | Tailwind directives + font & dark mode tweaks. |

### App Router Pages
| Path | Description |
| --- | --- |
| `frontend/app/layout.tsx` | Root layout applying `ThemeProvider` + `Navigation`. |
| `frontend/app/page.tsx` | Marketing hero with links to News and Ask sections. |
| `frontend/app/news/page.tsx` | Client component fetching `/api/news`; uses `SearchBar`, `FiltersBar`, `AnimatedLoadingSkeleton`, and renders article cards. |
| `frontend/app/ask-news-iq/page.tsx` | Wraps `ChatPanel` inside page layout. |
| ~~`frontend/app/articles/[id].tsx`~~ | ~~Removed: Articles now redirect directly to source URLs.~~ |

### Components
| Component | Purpose | Key Props/State |
| --- | --- | --- |
| `Navigation.tsx` | Top nav with active highlighting + theme toggle. Mobile hamburger menu for small screens. | Uses `usePathname`, responsive design. |
| `ThemeProvider.tsx` | Context for dark/light theme; persists to `localStorage`. | Provides `theme`, `toggleTheme`. |
| `ThemeToggle.tsx` | Button toggling theme context (sun/moon icons). | Reads context. |
| `SearchBar.tsx` | Styled text input with focus glow. | Props: `value`, `onChange`. Local `isFocused` state. |
| `FiltersBar.tsx` | Category + date filters. | Props: `filters`, `onChange`; uses `<select>` and `<input type="date">`. |
| `AnimatedLoadingSkeleton.tsx` | Framer-motion animated placeholder grid. | Responsive via window width listener. |
| `ChatPanel.tsx` | SSE chat UI with Markdown rendering and citation linking. | Manages `messages`, `input`, `category`, `AbortController`. Persists chat history to localStorage, includes clear button. |
| ~~`ExternalRedirect.tsx`~~ | ~~Removed: No longer needed as articles redirect directly to source URLs.~~ |
| `components/ui/animated-loading-skeleton.tsx` | same as default export; namespaced path for UI folder. | - |

### Styles
- Tailwind classes used throughout.
- `globals.css` sets font family (`Inter`) and ensures `.dark body` has proper colors.

## Misc
| File | Purpose |
| --- | --- |
| `frontend/app/news/page.tsx` (inline helper) | Implements `useDebounce` hook for search term updates. Displays articles with images, date grouping, Google News-inspired layout. Fully responsive. |
| `frontend/components/ChatPanel.tsx` | Contains `processArticleReferences` utility converting "Article X" mentions into Markdown links using SSE-provided mapping. Persists messages to localStorage with automatic save/load. |
| `frontend/next.config.mjs` | Next.js config with image remotePatterns for external article images, unoptimized images for external URLs. |
| `backend/migrate_add_image_url.py` | Standalone migration script to add `image_url` column to existing SQLite databases. |
| `docker-compose.yml` | Production Docker Compose configuration for backend and frontend services. |
| `docker-compose.dev.yml` | Development Docker Compose configuration with hot-reload support. |
| `backend/Dockerfile` | Multi-stage Docker build for FastAPI backend with health checks. |
| `frontend/Dockerfile` | Production Docker build for Next.js frontend. |
| `frontend/Dockerfile.dev` | Development Docker build for Next.js with hot-reload. |
| `DOCKER.md` | Comprehensive Docker setup, usage, and troubleshooting guide. |

This map should help locate relevant logic quickly when extending or debugging NewsIQ.


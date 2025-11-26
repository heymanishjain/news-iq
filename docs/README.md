# NewsIQ – RAG-Powered News Intelligence

Modern news monitoring platform that ingests technology, sports, business, and general headlines, stores structured text in SQLite plus Chroma, and serves a FastAPI + Next.js experience where users can browse feeds or ask natural-language questions answered by an OpenAI-powered Retrieval Augmented Generation (RAG) pipeline.

```
External Sources
(Hacker News, RSS, NewsAPI)
        │
        ▼
 Ingestion Pipeline (Python)
        │
        ├──> SQLite (article metadata & bodies)
        └──> Chroma (chunk embeddings + metadata)
        │
User ➜ Next.js UI ➜ FastAPI /api/query ➜ RAGService ➜ OpenAI
                               ▲                     │
                               └────── articles + citations ◄──┘
```

## Tech Stack
| Layer | Technology |
| --- | --- |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic, ChromaDB, OpenAI API, Uvicorn |
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, React Markdown, SSE |
| Tooling | PyEnv/Pip, npm, PostCSS/Autoprefixer, pytest |

## Features
- Scheduled or manual ingestion from Hacker News, curated RSS feeds, and NewsAPI.
- Deduplicated article storage with categories, timestamps, and cleaned body text.
- Chunking + embedding pipeline that streams context into Chroma for semantic search.
- REST API for listing articles, fetching details, refreshing ingestion, and running RAG queries (sync + SSE stream).
- Next.js dashboard with filters, debounced search, animated loading skeleton, and chat-like Ask NewsIQ panel.
- Dark/light theme toggling and responsive layouts.
- Source citations rendered inline with Markdown & link tracking.

## Prerequisites
- Python 3.10.x (pyenv recommended)
- Node.js ≥ 18.17 + npm ≥ 9
- OpenAI API key (for embeddings + chat)
- Optional: NewsAPI key for richer ingestion
- SQLite (ships with Python) and ~2 GB disk for Chroma persistence

## Local Setup (Step-by-Step)
1. **Clone & enter repository**
   ```bash
   git clone <repo-url> news-iq && cd news-iq
   ```
2. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   Then edit `backend/.env` and add your `OPENAI_API_KEY` (required for RAG) and optional `NEWS_API_KEY`.
3. **Install backend deps**
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Install frontend deps**
   ```bash
   cd ../frontend
   npm install
   ```
5. **Create databases & vector store**
   ```bash
   cd ../backend
   python ingest.py   # pulls sources, writes SQLite + Chroma
   ```
6. **Run backend API**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
7. **Run frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```
8. Browse `http://localhost:3000`, open `/news` for feed, `/ask-news-iq` for chat.

## Environment Variables
| Variable | Required? | Default | Description |
| --- | --- | --- | --- |
| `APP_NAME` | optional | `NewsIQ` | FastAPI title. |
| `DATABASE_URL` | optional | `sqlite:///./news_iq.db` | SQLAlchemy DSN for articles. |
| `OPENAI_API_KEY` | yes (RAG) | `""` | OpenAI client key; absence disables RAG. |
| `NEWS_API_KEY` | optional | `""` | Enables NewsAPI ingestion. |
| `VECTOR_STORE_DIR` | optional | `./storage/vector_store` | Chroma persistence path. |
| `CHUNK_SIZE` | optional | `600` | Characters per chunk in ingestion. |
| `CHUNK_OVERLAP` | optional | `120` | Sliding window overlap. |
| `INGESTION_BATCH_SIZE` | optional | `20` | Reserved for batching extenders. |
| `HACKER_NEWS_LIMIT` | optional | `30` | HN stories pulled per run. |
| `NEXT_PUBLIC_API_BASE_URL` | yes (frontend) | `http://localhost:8000` | FastAPI origin consumed by Next.js. |

## Environment Setup
Copy the example files and fill in your values:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY and optional NEWS_API_KEY

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local if your backend URL differs from http://localhost:8000
```

See `backend/.env.example` and `frontend/.env.example` for all available configuration options.

## Installing Dependencies
- **Backend**: `cd backend && pip install -r requirements.txt` (includes FastAPI, SQLAlchemy, Chroma, OpenAI, pytest).
- **Frontend**: `cd frontend && npm install` (Next.js, React, Tailwind, framer-motion, markdown libs).

## Running Locally
- **Ingestion refresh**: `cd backend && python ingest.py` or POST `/api/admin/refresh`.
- **Backend dev server**: `uvicorn app.main:app --reload`.
- **Frontend dev server**: `cd frontend && npm run dev`.
- **Tests**: `cd backend && pytest`.
- **Vector store reset**: delete `storage/vector_store/*` + rerun ingestion to reclaim space.

## Build Commands
- Backend production: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4` or `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`.
- Frontend production: `npm run build && npm run start`.
- Linting (Next built-in): `npm run lint`.

## Deployment
1. Provision environment variables + OpenAI/NewsAPI keys.
2. Run ingestion job (CI/CD step or cron) so SQLite/Chroma exist before serving traffic.
3. Deploy backend (FastAPI) behind reverse proxy (NGINX, Cloud Run, etc.); ensure `storage/vector_store` is persistent volume.
4. Deploy frontend (Next.js) via Vercel, Netlify, or Node host (`npm run start`), pointing `NEXT_PUBLIC_API_BASE_URL` to backend HTTPS origin.
5. Configure CORS allowed origins inside `app.main`.
6. Monitor ingestion logs and SSE endpoints; scale vector store and database as needed.

## Troubleshooting
- **`ModuleNotFoundError: sqlalchemy`** – ensure backend virtualenv is activated and `pip install -r requirements.txt` completed in that env (from `backend/` directory).
- **OpenAI key missing** – RAG service is disabled on startup if `OPENAI_API_KEY` empty; requests to `/api/query` will error.
- **Empty answers** – check `storage/vector_store` exists and ingestion ran successfully; verify question filters match categories present.
- **SSE hangs in ChatPanel** – confirm backend reachable over HTTP/HTTPS and not blocked by CORS; check browser console for `CORS` errors.
- **Large vector store** – delete stale directories under `storage/vector_store` and rerun ingestion to reclaim space.
- **NewsAPI quota issues** – API key optional; without it pipeline falls back to HN + RSS only.

## RAG Flow
1. **Ingestion**: External feeds -> cleaned text stored in SQLite + chunk embeddings saved to Chroma.
2. **Retrieval**: Question embedded via OpenAI, `top_k` relevant chunks fetched with optional metadata filtering.
3. **Prompt**: `_build_context` builds bullet list of excerpts with title/source/date/snippet.
4. **Generation**: OpenAI chat completion (`gpt-4o-mini`) answers with citations.
5. **Response**: API returns final text and structured article list for UI display.

## Future Enhancements
- Scheduled ingestion via cron/worker queues.
- User accounts and personalization.
- Additional news categories, languages, and multi-tenant vector stores.
- UI indicators for ingestion status and vector-store health.
- Query analytics dashboards and caching layers.


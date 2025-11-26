# Package Inventory

## Backend (`backend/requirements.txt`)
| Package | Version | Type | Purpose / Usage | Example |
| --- | --- | --- | --- | --- |
| fastapi | 0.122.0 | runtime | Core web framework for REST + SSE endpoints. | `app = FastAPI(title=settings.app_name)` |
| uvicorn[standard] | 0.29.0 | runtime | ASGI server used for dev/prod hosting. | `uvicorn app.main:app --reload` |
| sqlalchemy | 2.0.23 | runtime | ORM for articles, queries, pagination. | `db.query(Article)` in `routes_news`. |
| pydantic | 2.12.4 | runtime | Request/response validation and schema serialization. | `class ArticleRead(BaseModel)` |
| pydantic-settings | 2.1.0 | runtime | Loads `.env` config via `Settings`. | `settings = get_settings()` |
| requests | 2.31.0 | runtime | HTTP client for HN/RSS/NewsAPI fetches. | `requests.get(HN_TOP_STORIES, timeout=10)` |
| feedparser | 6.0.11 | runtime | Parses RSS feeds into entries. | `feedparser.parse(feed["url"])` |
| numpy | <2.0 | runtime | Dependency for chromadb/OpenAI embeddings. | Implicit via chromadb operations. |
| chromadb | 0.4.22 | runtime | Persistent vector store for embeddings. | `chromadb.PersistentClient(path=...)` |
| openai | 1.3.5 | runtime | Embedding + chat completions for RAG. | `self.client.chat.completions.create(...)` |
| httpx | <0.28.0 | runtime | Transport dependency (OpenAI SDK). | Indirect usage through OpenAI client. |
| pytest | 7.4.4 | dev/test | Test runner for backend unit tests. | `pytest` |

## Frontend (`frontend/package.json`)
| Package | Version | Type | Purpose / Usage | Example |
| --- | --- | --- | --- | --- |
| next | 14.0.4 | dependency | React framework, App Router. | `export default function NewsPage()` |
| react | 18.2.0 | dependency | Core UI library. | `useState`, `useEffect`. |
| react-dom | 18.2.0 | dependency | DOM-specific React bindings. | Used by Next runtime. |
| tailwindcss | 3.3.5 | dependency | Utility-first styling. | `className="bg-primary"` |
| autoprefixer | 10.4.15 | dependency | CSS prefixing via PostCSS. | Configured in `postcss.config.js`. |
| postcss | 8.4.31 | dependency | Processes Tailwind build. | `module.exports = { plugins: { tailwindcss, autoprefixer } }`. |
| framer-motion | ^12.23.24 | dependency | Animations for skeleton/loading UI. | `const controls = useAnimation()` |
| react-markdown | ^10.1.0 | dependency | Renders LLM responses as Markdown. | `<ReactMarkdown>{content}</ReactMarkdown>` |
| remark-gfm | ^4.0.1 | dependency | Enables GitHub-flavored Markdown features. | `remarkPlugins={[remarkGfm]}` |
| rehype-raw | ^7.0.0 | dependency | Allows raw HTML within markdown (controlled). | `rehypePlugins={[rehypeRaw]}` |
| @types/node | 20.10.0 | devDependency | Type definitions for Node APIs. | TypeScript config/build. |
| @types/react | 18.2.34 | devDependency | React type definitions. | All `.tsx` files. |
| @types/react-dom | 18.2.14 | devDependency | ReactDOM type definitions. | Next server/client components. |
| typescript | 5.2.2 | devDependency | Type checking + tooling. | `tsconfig.json`. |


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_admin import router as admin_router
from app.api.routes_news import router as news_router
from app.api.routes_query import router as query_router
from app.core.config import get_settings
from app.core.db import Base, engine

settings = get_settings()
app = FastAPI(title=settings.app_name)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    if settings.openai_api_key:
        from app.services.llm_client import LLMClient
        from app.services.rag_service import RAGService
        from app.services.vector_store import VectorStore

        llm_client = LLMClient(api_key=settings.openai_api_key)
        vector_store = VectorStore()
        app.state.rag_service = RAGService(llm_client, vector_store)
    else:
        app.state.rag_service = None


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(news_router)
app.include_router(query_router)
app.include_router(admin_router)

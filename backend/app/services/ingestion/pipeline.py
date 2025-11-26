import logging
from typing import Iterable, List

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import Base, SessionLocal, engine
from app.models.article import Article
from app.schemas.article import ArticleCreate
from app.services.ingestion.hn_ingestor import HackerNewsIngestor
from app.services.ingestion.newsapi_ingestor import NewsAPIIngestor
from app.services.ingestion.rss_ingestor import RSSIngestor
from app.services.llm_client import LLMClient
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)

settings = get_settings()


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    if not text:
        return []
    chunks: List[str] = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == length:
            break
        start = max(0, end - overlap)
        if start >= length:
            break
    return chunks


def upsert_article(session: Session, article_data: ArticleCreate) -> Article:
    url_str = str(article_data.url)
    article = session.query(Article).filter(Article.url == url_str).first()
    if article:
        article.title = article_data.title
        article.source = article_data.source
        article.published_at = article_data.published_at
        article.category = article_data.category
        article.content = article_data.content
        article.image_url = article_data.image_url
    else:
        payload = article_data.model_dump()
        payload["url"] = url_str
        article = Article(**payload)
        session.add(article)
    session.commit()
    session.refresh(article)
    return article


def ingest_articles(
    session: Session,
    articles: Iterable[ArticleCreate],
    vector_store: VectorStore,
    llm_client: LLMClient | None,
):
    for article_data in articles:
        article = upsert_article(session, article_data)
        if not llm_client:
            continue
        chunks = chunk_text(article.content, settings.chunk_size, settings.chunk_overlap)
        if not chunks:
            continue
        embeddings = llm_client.embed_texts(chunks)
        vector_store.add_chunks(
            article.id,
            chunks,
            embeddings,
            metadata={
                "category": article.category,
                "published_at": article.published_at.isoformat(),
                "title": article.title,
                "source": article.source,
                "url": article.url,
            },
        )


def run_ingestion():
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting ingestion pipeline")
    Base.metadata.create_all(bind=engine)
    llm_client = None
    if settings.openai_api_key:
        llm_client = LLMClient(api_key=settings.openai_api_key)
    vector_store = VectorStore()
    session = SessionLocal()
    try:
        ingestors = [HackerNewsIngestor(), RSSIngestor(), NewsAPIIngestor()]
        for ingestor in ingestors:
            articles = ingestor.fetch_articles()
            logger.info("Fetched %s articles from %s", len(articles), ingestor.__class__.__name__)
            ingest_articles(session, articles, vector_store, llm_client)
    finally:
        session.close()
    logger.info("Ingestion complete")


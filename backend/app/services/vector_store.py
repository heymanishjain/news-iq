import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import chromadb

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = chromadb.PersistentClient(path=str(settings.vector_store_path))
        self.collection = self.client.get_or_create_collection(name="news_articles")

    def add_chunks(
        self,
        article_id: int,
        chunks: List[str],
        embeddings: List[List[float]],
        metadata: Dict[str, Any],
    ) -> None:
        ids = [f"article-{article_id}-chunk-{idx}" for idx in range(len(chunks))]
        metadatas = []
        for idx, chunk in enumerate(chunks):
            metadatas.append(
                {
                    "article_id": article_id,
                    "chunk_index": idx,
                    "category": metadata.get("category"),
                    "published_at": metadata.get("published_at"),
                    "title": metadata.get("title"),
                    "source": metadata.get("source"),
                    "url": metadata.get("url"),
                    "snippet": chunk[:400],
                }
            )
        self.collection.upsert(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)

    def similarity_search(
        self,
        embedding: List[float],
        top_k: int = 8,
        category: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        where: Dict[str, Any] = {}
        if category:
            where["category"] = category
        if date_from or date_to:
            date_filter: Dict[str, Any] = {}
            if date_from:
                date_filter["$gte"] = date_from.isoformat()
            if date_to:
                date_filter["$lte"] = date_to.isoformat()
            where["published_at"] = date_filter
        # Check collection count for debugging
        collection_count = self.collection.count()
        logger.info(f"Vector store collection has {collection_count} items. Querying with top_k={top_k}, category={category}, date_from={date_from}, date_to={date_to}")
        
        results = self.collection.query(query_embeddings=[embedding], n_results=top_k, where=where)
        metadatas = results.get("metadatas", [[]])[0] or []
        documents = results.get("documents", [[]])[0] or []
        distances = results.get("distances", [[]])[0] or []
        
        logger.info(f"Query returned {len(documents)} documents, {len(metadatas)} metadatas")
        
        records = []
        for meta, doc, distance in zip(metadatas, documents, distances):
            # Only include records with valid document content
            if doc and doc.strip():
                record = {**meta, "document": doc, "score": distance}
                records.append(record)
            else:
                logger.warning(f"Skipping record with empty document. Metadata: {meta}")
        
        logger.info(f"Returning {len(records)} valid records after filtering")
        return records

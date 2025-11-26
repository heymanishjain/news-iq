from datetime import datetime
from typing import Any, Dict, List, Optional

import chromadb

from app.core.config import get_settings


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
        results = self.collection.query(query_embeddings=[embedding], n_results=top_k, where=where)
        metadatas = results.get("metadatas", [[]])[0]
        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        records = []
        for meta, doc, distance in zip(metadatas, documents, distances):
            record = {**meta, "document": doc, "score": distance}
            records.append(record)
        return records

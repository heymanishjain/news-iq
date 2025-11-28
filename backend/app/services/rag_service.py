import logging
from datetime import datetime
from typing import TYPE_CHECKING, Dict, Generator, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.query import QueryArticle
from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from app.services.vector_store import VectorStore

SYSTEM_PROMPT = (
    "You are a helpful news assistant. Your job is to answer questions about news articles using the provided context.\n\n"
    "Instructions:\n"
    "1. Use the information from the provided articles in the CONTEXT to answer the question.\n"
    "2. When you reference information from an article, cite it using this format: (Article N), "
    "where N is the article number shown in the CONTEXT.\n"
    "3. Provide a comprehensive answer based on the articles provided, even if they don't perfectly match the exact date mentioned in the question.\n"
    "4. If the articles contain relevant information, summarize it clearly and group related information together.\n"
    "5. Only mention that information is missing if the articles truly contain no relevant content at all.\n"
    "6. Be helpful and informative - extract and present the most relevant information from the articles.\n"
)


class RAGService:
    def __init__(self, llm_client: LLMClient, vector_store: "VectorStore") -> None:
        self.llm_client = llm_client
        self.vector_store = vector_store

    def _expand_query(self, question: str) -> str:
        """
        Expand the query with related terms to improve semantic search.
        This helps the embedding model find more relevant articles.
        """
        question_lower = question.lower()
        
        # Technology-related expansions
        if any(word in question_lower for word in ["technology", "tech", "tech trends", "tech news", "latest tech"]):
            return f"{question} technology innovations software hardware AI artificial intelligence digital transformation tech industry"
        
        # Sports-related expansions
        if any(word in question_lower for word in ["sports", "sport", "athlete", "game", "match"]):
            return f"{question} sports news games matches athletes teams championships"
        
        # Business-related expansions
        if any(word in question_lower for word in ["business", "economy", "market", "finance", "stock", "company"]):
            return f"{question} business news economy market finance companies stocks"
        
        return question

    def _detect_category(self, question: str) -> Optional[str]:
        """
        Detect category from question if not explicitly provided.
        """
        question_lower = question.lower()
        
        if any(word in question_lower for word in ["technology", "tech", "software", "hardware", "AI", "artificial intelligence", "digital", "innovation"]):
            return "technology"
        elif any(word in question_lower for word in ["sports", "sport", "athlete", "game", "match", "football", "basketball"]):
            return "sports"
        elif any(word in question_lower for word in ["business", "economy", "market", "finance", "stock", "company", "corporate"]):
            return "business"
        
        return None

    def _build_context(self, records: List[Dict]) -> str:
        """
        Build a clear, structured context block for the LLM.
        Each article is numbered so the model can cite it as (Article N).
        """
        context_lines: List[str] = ["You are given the following news article excerpts:\n"]
        valid_records = 0
        
        for idx, record in enumerate(records, start=1):
            # Use document field which contains the full chunk text from vector store
            excerpt = record.get("document") or record.get("snippet") or record.get("content") or ""
            
            # Skip records with empty excerpts
            if not excerpt or not excerpt.strip():
                logger.warning(f"Skipping record {idx} with empty excerpt. Keys: {list(record.keys())}")
                continue
            
            valid_records += 1
            
            # Safely get metadata fields with fallbacks
            title = record.get("title") or "Unknown Title"
            source = record.get("source") or "Unknown Source"
            published_at = record.get("published_at") or "Unknown Date"
            
            context_lines.append(
                f"  Article {valid_records}:\n"
                f"  Title: {title}\n"
                f"  Source: {source}\n"
                f"  Published at: {published_at}\n"
                f"  Content:\n"
                f"  {excerpt}\n"
            )
        
        if valid_records == 0:
            logger.error("No valid records with content found!")
            return "No article content available."
        
        context = "\n".join(context_lines)
        logger.info(f"Built context with {valid_records} valid records out of {len(records)} total, context length: {len(context)} chars")
        return context

    def _build_user_prompt(self, context: str, question: str) -> str:
        """
        Build the full user-side prompt that includes context, question,
        and clear instructions for how to answer.
        """
        return (
            f"{context}\n\n"
            f"Question: {question}\n\n"
            "Please answer the question above using the information from the articles provided. "
            "Cite your sources using (Article N) format. Provide a helpful and informative answer based on the available information.\n"
        )

    def answer_question(
        self,
        question: str,
        session: Session,
        *,
        category: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        top_k: int = 8,
    ) -> Dict:
        """
        Non-streaming RAG answer.
        Returns:
            {
                "answer": str,
                "articles": List[QueryArticle]
            }
        """
        # 1. Embed the question
        question_embedding = self.llm_client.embed_texts([question])[0]

        # 2. Retrieve similar records from vector store
        records = self.vector_store.similarity_search(
            question_embedding,
            top_k=top_k,
            category=category,
            date_from=date_from,
            date_to=date_to,
        )

        logger.info(f"Retrieved {len(records)} records for question: {question[:100]}")
        if not records:
            logger.warning(f"No records found for question: {question}")
            return {"answer": "No relevant articles found.", "articles": []}

        # Log first record structure for debugging
        if records:
            logger.debug(f"First record keys: {records[0].keys()}")
            logger.debug(f"First record has document: {'document' in records[0]}")
            logger.debug(f"First record document length: {len(records[0].get('document', ''))}")

        # 3. Build context and user prompt
        context = self._build_context(records)
        user_prompt = self._build_user_prompt(context, question)

        # 4. Get LLM answer
        answer = self.llm_client.generate_response(SYSTEM_PROMPT, user_prompt)

        # 5. Resolve article IDs and load full article metadata from DB
        article_ids = {record["article_id"] for record in records}
        articles = session.query(Article).filter(Article.id.in_(article_ids)).all()

        articles_payload = [
            QueryArticle(
                id=article.id,
                title=article.title,
                source=article.source,
                url=article.url,
                published_at=article.published_at,
                category=article.category,
            )
            for article in articles
        ]

        return {"answer": answer, "articles": articles_payload}

    def answer_question_stream(
        self,
        question: str,
        session: Session,
        *,
        category: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        top_k: int = 8,
    ) -> Generator[Tuple[str, List[Dict], Dict[int, int]], None, None]:
        """
        Streaming RAG answer.

        Yields tuples of:
            (partial_answer_text, articles_payload, article_number_to_id_mapping)

        - During streaming, articles_payload will be [] until the final yield.
        - article_number_to_id_mapping is always provided once records are found:
            { article_number (1-based): article_id (DB PK) }
        """
        # 1. Detect category from question if not provided
        detected_category = category or self._detect_category(question)
        if detected_category and not category:
            logger.info(f"Auto-detected category '{detected_category}' from streaming question: {question[:100]}")
        
        # 2. Expand query for better semantic search
        expanded_query = self._expand_query(question)
        logger.info(f"Original streaming query: {question[:100]}, Expanded: {expanded_query[:150]}")
        
        # 3. Embed the expanded question
        question_embedding = self.llm_client.embed_texts([expanded_query])[0]

        # 4. Retrieve similar records from vector store (increase top_k for better results)
        search_top_k = max(top_k * 2, 16)  # Get more candidates
        records = self.vector_store.similarity_search(
            question_embedding,
            top_k=search_top_k,
            category=detected_category,
            date_from=date_from,
            date_to=date_to,
        )
        
        # 5. If we have a detected category but got few results, try without category filter
        if detected_category and len(records) < top_k:
            logger.info(f"Got only {len(records)} results with category filter, trying without category")
            records_no_filter = self.vector_store.similarity_search(
                question_embedding,
                top_k=search_top_k,
                category=None,
                date_from=date_from,
                date_to=date_to,
            )
            # Merge and deduplicate by article_id, keeping best matches
            seen_ids = {r["article_id"] for r in records}
            for record in records_no_filter:
                if record["article_id"] not in seen_ids:
                    records.append(record)
                    seen_ids.add(record["article_id"])
                if len(records) >= search_top_k:
                    break
        
        # 6. Take top_k results (they're already sorted by similarity)
        records = records[:top_k]

        logger.info(f"Retrieved {len(records)} records for streaming question: {question[:100]}")
        if not records:
            logger.warning(f"No records found for streaming question: {question}")
            # No records: single yield with a message and empty metadata
            yield ("No relevant articles found.", [], {})
            return

        # 3. Create mapping: article_number (1-indexed) -> article_id
        article_number_to_id: Dict[int, int] = {}
        for idx, record in enumerate(records, start=1):
            article_number_to_id[idx] = record["article_id"]

        # 4. Build context and user prompt
        context = self._build_context(records)
        user_prompt = self._build_user_prompt(context, question)

        # 5. Stream the answer tokens
        full_answer = ""
        for token in self.llm_client.generate_response_stream(SYSTEM_PROMPT, user_prompt):
            full_answer += token
            # During streaming we don't yet have the DB articles payload, only mapping
            yield (full_answer, [], article_number_to_id)

        # 6. After streaming completes, fetch full article metadata from DB
        article_ids = {record["article_id"] for record in records}
        articles = session.query(Article).filter(Article.id.in_(article_ids)).all()

        articles_payload: List[Dict] = [
            {
                "id": article.id,
                "title": article.title,
                "source": article.source,
                "url": article.url,
                "published_at": article.published_at.isoformat() if article.published_at else None,
                "category": article.category,
            }
            for article in articles
        ]

        # 7. Final yield with complete answer, articles, and mapping
        yield (full_answer, articles_payload, article_number_to_id)

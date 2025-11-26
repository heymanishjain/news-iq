from datetime import datetime
from typing import TYPE_CHECKING, Dict, Generator, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.query import QueryArticle
from app.services.llm_client import LLMClient

if TYPE_CHECKING:
    from app.services.vector_store import VectorStore

SYSTEM_PROMPT = (
    "You are a factual news assistant. Your job is to answer questions about news articles.\n\n"
    "Rules:\n"
    "1. Use ONLY the information from the provided articles in the CONTEXT.\n"
    "2. Do NOT invent facts that are not supported by the articles.\n"
    "3. When you use information from an article, explicitly cite it using this format: (Article N), "
    "where N is the article number shown in the CONTEXT.\n"
    "4. If the articles do not contain enough information to fully answer, say so clearly and explain what is missing.\n"
    "5. Summarize concisely but completely, and group related information together.\n"
)


class RAGService:
    def __init__(self, llm_client: LLMClient, vector_store: "VectorStore") -> None:
        self.llm_client = llm_client
        self.vector_store = vector_store

    def _build_context(self, records: List[Dict]) -> str:
        """
        Build a clear, structured context block for the LLM.
        Each article is numbered so the model can cite it as (Article N).
        """
        context_lines: List[str] = ["You are given the following news article excerpts:\n"]
        for idx, record in enumerate(records, start=1):
            # Prefer snippet; fall back to content if needed
            excerpt = record.get("snippet") or record.get("content") or ""
            context_lines.append(
                f"  Article {idx}:\n"
                f"  Title: {record['title']}\n"
                f"  Source: {record['source']}\n"
                f"  Published at: {record['published_at']}\n"
                f"  Excerpt:\n"
                f"  {excerpt}\n"
            )
        return "\n".join(context_lines)

    def _build_user_prompt(self, context: str, question: str) -> str:
        """
        Build the full user-side prompt that includes context, question,
        and clear instructions for how to answer.
        """
        return (
            f"{context}\n\n"
            "User question:\n"
            f"{question}\n\n"
            "Instructions:\n"
            "- Answer the user's question using ONLY the information from the articles above.\n"
            "- When you reference information from an article, cite it like this: (Article N).\n"
            "- If you are unsure or the context does not contain enough information, say so explicitly.\n"
            "Now provide your answer:\n"
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

        if not records:
            return {"answer": "No relevant articles found.", "articles": []}

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

        if not records:
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

import json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.query import QueryRequest, QueryResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/query", tags=["query"])


def get_rag_service(request: Request) -> RAGService:
    rag_service = getattr(request.app.state, "rag_service", None)
    if rag_service is None:
        raise RuntimeError("RAG service not configured")
    return rag_service


@router.post("", response_model=QueryResponse)
def query_news(
    payload: QueryRequest,
    db: Session = Depends(get_db),
    rag_service: RAGService = Depends(get_rag_service),
):
    filters = payload.filters or {}
    result = rag_service.answer_question(
        payload.question,
        db,
        category=getattr(filters, "category", None),
        date_from=getattr(filters, "date_from", None),
        date_to=getattr(filters, "date_to", None),
    )
    return QueryResponse(**result)


@router.post("/stream")
def query_news_stream(
    payload: QueryRequest,
    db: Session = Depends(get_db),
    rag_service: RAGService = Depends(get_rag_service),
):
    """Stream chat responses using Server-Sent Events"""
    filters = payload.filters or {}

    def generate():
        try:
            article_mapping = {}
            for answer_text, articles, mapping in rag_service.answer_question_stream(
                payload.question,
                db,
                category=getattr(filters, "category", None),
                date_from=getattr(filters, "date_from", None),
                date_to=getattr(filters, "date_to", None),
            ):
                # Update mapping if provided
                if mapping:
                    article_mapping = mapping
                
                # Send incremental updates
                data = {
                    "type": "chunk",
                    "content": answer_text,
                    "articles": articles if articles else None,
                    "article_mapping": article_mapping if article_mapping else None,
                    "done": bool(articles),
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            error_data = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

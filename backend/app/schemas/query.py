from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class QueryFilters(BaseModel):
    category: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class QueryRequest(BaseModel):
    question: str
    filters: QueryFilters | None = None


class QueryArticle(BaseModel):
    id: int
    title: str
    source: str
    url: str
    published_at: datetime
    category: str


class QueryResponse(BaseModel):
    answer: str
    articles: List[QueryArticle]

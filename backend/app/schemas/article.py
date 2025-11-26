from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, HttpUrl


class ArticleBase(BaseModel):
    title: str
    source: str
    url: HttpUrl
    published_at: datetime
    category: str
    content: str


class ArticleCreate(ArticleBase):
    pass


class ArticleRead(ArticleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ArticleRead]


class ArticleFilters(BaseModel):
    q: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20

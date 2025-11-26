from abc import ABC, abstractmethod
from typing import List

from app.schemas.article import ArticleCreate


class BaseIngestor(ABC):
    @abstractmethod
    def fetch_articles(self) -> List[ArticleCreate]:
        raise NotImplementedError

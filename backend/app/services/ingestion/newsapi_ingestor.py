from datetime import datetime, timezone
from typing import List

import requests

from app.core.config import get_settings
from app.schemas.article import ArticleCreate
from app.utils.text_cleaning import clean_html

from .base_ingestor import BaseIngestor

NEWSAPI_HEADLINES = "https://newsapi.org/v2/top-headlines"
NEWSAPI_EVERYTHING = "https://newsapi.org/v2/everything"


class NewsAPIIngestor(BaseIngestor):
    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = getattr(self.settings, "news_api_key", "")

    def fetch_articles(self) -> List[ArticleCreate]:
        if not self.api_key:
            return []

        articles: List[ArticleCreate] = []
        
        # Fetch top headlines from multiple categories
        categories = ["technology", "sports", "business", "general"]
        
        for category in categories:
            try:
                params = {
                    "apiKey": self.api_key,
                    "category": category,
                    "pageSize": 20,
                    "language": "en",
                }
                response = requests.get(NEWSAPI_HEADLINES, params=params, timeout=10)
                if response.status_code != 200:
                    continue
                
                data = response.json()
                if data.get("status") != "ok":
                    continue
                
                for article_data in data.get("articles", []):
                    if not article_data.get("title") or not article_data.get("url"):
                        continue
                    
                    # Skip if URL is blocked or invalid
                    if article_data.get("url") == "[Removed]":
                        continue
                    
                    # Parse published date
                    published_str = article_data.get("publishedAt")
                    if published_str:
                        try:
                            published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
                        except Exception:
                            published_at = datetime.now(timezone.utc)
                    else:
                        published_at = datetime.now(timezone.utc)
                    
                    # Get content
                    content = article_data.get("content") or article_data.get("description") or article_data.get("title", "")
                    cleaned_content = clean_html(content)
                    
                    article = ArticleCreate(
                        title=article_data["title"],
                        source=article_data.get("source", {}).get("name", "NewsAPI"),
                        url=article_data["url"],
                        published_at=published_at,
                        category=category,
                        content=cleaned_content,
                    )
                    articles.append(article)
            except Exception:
                continue
        
        return articles


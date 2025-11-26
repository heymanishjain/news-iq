from datetime import datetime, timezone
from typing import List

import requests

from app.core.config import get_settings
from app.schemas.article import ArticleCreate
from app.utils.text_cleaning import clean_html

from .base_ingestor import BaseIngestor

HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"


class HackerNewsIngestor(BaseIngestor):
    def __init__(self) -> None:
        self.settings = get_settings()

    def fetch_articles(self) -> List[ArticleCreate]:
        try:
            ids = requests.get(HN_TOP_STORIES, timeout=10).json()
        except Exception:
            return []

        articles: List[ArticleCreate] = []
        for story_id in ids[: self.settings.hacker_news_limit]:
            try:
                story = requests.get(HN_ITEM.format(id=story_id), timeout=10).json()
            except Exception:
                continue
            if not story or not story.get("title") or not story.get("url"):
                continue

            content = story.get("text") or story.get("title")
            cleaned_content = clean_html(content)
            published_at = datetime.fromtimestamp(story.get("time", datetime.now().timestamp()), tz=timezone.utc)
            
            # Try to extract image from URL metadata or content
            image_url = None
            # Hacker News doesn't provide images, but we can try to extract from the article URL
            # For now, leave as None since HN articles typically don't have images
            
            article = ArticleCreate(
                title=story["title"],
                source="Hacker News",
                url=story["url"],
                published_at=published_at,
                category="technology",
                content=cleaned_content,
                image_url=image_url,
            )
            articles.append(article)
        return articles

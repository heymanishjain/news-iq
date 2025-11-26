from datetime import datetime, timezone
from typing import List

import feedparser
import requests

from app.schemas.article import ArticleCreate
from app.utils.text_cleaning import clean_html

from .base_ingestor import BaseIngestor


RSS_FEEDS = [
    {
        "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",
        "category": "technology",
        "source": "Ars Technica",
    },
    {
        "url": "https://www.espn.com/espn/rss/news",
        "category": "sports",
        "source": "ESPN",
    },
]


class RSSIngestor(BaseIngestor):
    def fetch_articles(self) -> List[ArticleCreate]:
        collected: List[ArticleCreate] = []
        for feed in RSS_FEEDS:
            parsed = feedparser.parse(feed["url"])
            for entry in parsed.entries:
                summary = entry.get("summary", entry.get("description", ""))
                content_text = clean_html(summary)
                if not content_text:
                    continue
                link = entry.get("link")
                if not link:
                    continue
                published = entry.get("published_parsed")
                if published:
                    published_at = datetime.fromtimestamp(
                        datetime(*published[:6], tzinfo=timezone.utc).timestamp(), tz=timezone.utc
                    )
                else:
                    published_at = datetime.now(timezone.utc)

                cleaned_article = ArticleCreate(
                    title=entry.get("title", "Untitled"),
                    source=feed["source"],
                    url=link,
                    published_at=published_at,
                    category=feed["category"],
                    content=content_text,
                )
                # Attempt to fetch full content if available
                try:
                    response = requests.get(link, timeout=10)
                    if response.ok:
                        full_text = clean_html(response.text)
                        if full_text:
                            cleaned_article.content = full_text
                except Exception:
                    pass
                collected.append(cleaned_article)
        return collected

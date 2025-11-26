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
    {
        "url": "https://www.thehindu.com/feeder/default.rss",
        "category": "general",
        "source": "The Hindu",
    },
    {
        "url": "https://indianexpress.com/feed/",
        "category": "general",
        "source": "The Indian Express",
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

                # Extract image URL from RSS entry
                image_url = None
                if "media_content" in entry and len(entry.media_content) > 0:
                    image_url = entry.media_content[0].get("url")
                elif "media_thumbnail" in entry and len(entry.media_thumbnail) > 0:
                    image_url = entry.media_thumbnail[0].get("url")
                elif "links" in entry:
                    for link_obj in entry.links:
                        if link_obj.get("type", "").startswith("image/"):
                            image_url = link_obj.get("href")
                            break
                
                # Try to extract image from summary/description HTML
                if not image_url:
                    import re
                    summary_html = entry.get("summary", entry.get("description", ""))
                    if summary_html:
                        # Look for img tags
                        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary_html, re.IGNORECASE)
                        if img_match:
                            image_url = img_match.group(1)
                        # Look for og:image or twitter:image meta tags in content
                        og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', summary_html, re.IGNORECASE)
                        if og_match:
                            image_url = og_match.group(1)

                cleaned_article = ArticleCreate(
                    title=entry.get("title", "Untitled"),
                    source=feed["source"],
                    url=link,
                    published_at=published_at,
                    category=feed["category"],
                    content=content_text,
                    image_url=image_url,
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

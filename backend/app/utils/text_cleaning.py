import re
from html import unescape


TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


def clean_html(raw_html: str) -> str:
    text = TAG_RE.sub(" ", raw_html)
    text = unescape(text)
    text = WHITESPACE_RE.sub(" ", text)
    return text.strip()

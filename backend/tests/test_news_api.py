from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.db import Base, get_db
from app.main import app
from app.models.article import Article

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_news.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_article():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session: Session = TestingSessionLocal()
    session.query(Article).delete()
    article = Article(
        title="Test Article",
        source="UnitTest",
        url="https://example.com/test",
        published_at=datetime.utcnow(),
        category="technology",
        content="Sample content",
    )
    session.add(article)
    session.commit()
    session.close()


def test_news_list_returns_paginated_response():
    app.dependency_overrides[get_db] = override_get_db
    seed_article()
    client = TestClient(app)
    response = client.get("/api/news?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert isinstance(data["items"], list)
    assert data["items"][0]["title"] == "Test Article"

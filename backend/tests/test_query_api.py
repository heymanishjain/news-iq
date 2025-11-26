from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api import routes_query
from app.core.db import Base, get_db
from app.main import app
from app.models.article import Article

engine = create_engine("sqlite:///./test_query.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class FakeRagService:
    def answer_question(self, question, session, **kwargs):
        article = session.query(Article).first()
        return {
            "answer": f"Stub answer for {question}",
            "articles": [
                {
                    "id": article.id if article else 0,
                    "title": article.title if article else "",
                    "source": article.source if article else "",
                    "url": article.url if article else "",
                    "published_at": article.published_at if article else datetime.utcnow(),
                    "category": article.category if article else "",
                }
            ],
        }


def override_rag_service():
    return FakeRagService()


def seed_article():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    session.query(Article).delete()
    article = Article(
        title="Query Test Article",
        source="UnitTest",
        url="https://example.com/query",
        published_at=datetime.utcnow(),
        category="sports",
        content="Query content",
    )
    session.add(article)
    session.commit()
    session.close()


def test_query_endpoint_structure():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[routes_query.get_rag_service] = override_rag_service
    seed_article()
    client = TestClient(app)
    response = client.post(
        "/api/query",
        json={"question": "What is happening?", "filters": {"category": "sports"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["articles"], list)
    assert data["articles"][0]["title"] == "Query Test Article"

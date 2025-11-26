from typing import Generator, List

from openai import OpenAI


class LLMClient:
    def __init__(self, api_key: str, embedding_model: str = "text-embedding-3-small", llm_model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        self.client = OpenAI(api_key=api_key)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        response = self.client.embeddings.create(model=self.embedding_model, input=texts)
        return [item.embedding for item in response.data]

    def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content or "No answer generated."
        return "No answer generated."

    def generate_response_stream(self, system_prompt: str, user_prompt: str) -> Generator[str, None, None]:
        """Generator that yields tokens as they're generated for streaming"""
        stream = self.client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    yield delta.content

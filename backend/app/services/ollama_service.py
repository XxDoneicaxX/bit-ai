import json
import os

import requests
from dotenv import load_dotenv

from app.prompt.bitPrompt import BIT_SYSTEM_PROMPT

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "gemma4:e4b")


def generate_response(messages):
    ollama_messages = [
        {
            "role": "system",
            "content": BIT_SYSTEM_PROMPT
        }
    ]

    recent_messages = messages[-6:]

    for message in recent_messages:
        ollama_messages.append(
            {
                "role": message.role,
                "content": message.content
            }
        )

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "messages": ollama_messages,
            "stream": True,
            "think": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 170,
                "num_ctx": 4096
            }
        },
        stream=True,
        timeout=180
    )

    response.raise_for_status()

    try:
        for line in response.iter_lines():
            if not line:
                continue

            data = json.loads(line)
            chunk = data.get("message", {}).get("content", "")

            if chunk:
                yield chunk

            if data.get("done"):
                break
    finally:
        response.close()

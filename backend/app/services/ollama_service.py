import json

import requests

from app.prompt.bitPrompt import BIT_SYSTEM_PROMPT


OLLAMA_URL = "http://localhost:11434/api/chat"


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
            "model": "gemma4:e4b",
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

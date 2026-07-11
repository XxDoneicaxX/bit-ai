# Bit

Bit is a friendly Python tutor chatbot built for 4th and 5th grade students (ages 9-11). It explains and guides instead of solving problems for the student, runs entirely on a local LLM through [Ollama](https://ollama.com), and never sends anything to the cloud.

## Features

- **Streams replies token-by-token** as Bit "types," instead of waiting for the full response.
- **Syntax-highlighted Python code blocks** — no libraries, just a small hand-rolled highlighter.
- **Multiple-choice comprehension checks** — Bit can check understanding with clickable options instead of always asking open-ended questions.
- **Kid-friendly teaching philosophy** baked into the system prompt: short, plain-language answers, everyday analogies, never hands over a full solution, and always keeps things Python-only.

## Tech stack

- **Backend**: FastAPI (Python), streaming responses from a local [Ollama](https://ollama.com) model over `requests`
- **Frontend**: React 19 + Vite, no UI/state libraries beyond `react`/`react-dom`
- **Model**: runs locally via Ollama (see `backend/app/services/ollama_service.py` for the exact model name)

## Project structure

```
backend/
  app/
    api/chat.py           FastAPI route: POST /chat
    services/ollama_service.py   Streams from Ollama, builds the message history
    prompt/bitPrompt.py   Bit's system prompt / personality / teaching rules
    models/chat_models.py Pydantic request models
  requirements.txt

frontend/
  src/
    App.jsx               Chat UI, state, streaming fetch logic
    App.Css                Styling
    messageParsing.jsx     Parses code blocks / quiz blocks out of message text
```

## Running it locally

### 1. Ollama

Install [Ollama](https://ollama.com) and make sure it's running, then pull the model referenced in `backend/app/services/ollama_service.py`:

```
ollama pull <model-name>
```

### 2. Backend

```
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173`).

The backend's CORS config only allows `http://localhost:5173` and `http://127.0.0.1:5173`, so keep the frontend on the default Vite port unless you also update `backend/app/main.py`.

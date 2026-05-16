"""Scholar AI — study companion, web search, and YouTube suggestions."""
import os
import re
from typing import Any

YOUTUBE_TRIGGERS = re.compile(
    r"\b(youtube|video|videos|watch|lecture|tutorial|documentary|playlist)\b",
    re.I,
)
SEARCH_TRIGGERS = re.compile(
    r"\b(search|find|lookup|look up|google|sources?|articles?|papers?|research)\b",
    re.I,
)
EXPLAIN_TRIGGERS = re.compile(
    r"\b(explain|what is|what are|define|summary|summarize|summarise|describe|meaning of|how does)\b",
    re.I,
)
GREETING_TRIGGERS = re.compile(
    r"^\s*((hi|hello|hey)\s*)?(how are you|what'?s up|whats up)\s*[!.?]*\s*$|^\s*(hi|hello|hey|good morning|good afternoon|good evening)\s*[!.?]*\s*$",
    re.I,
)
PLAN_TRIGGERS = re.compile(
    r"\b(study plan|schedule|organize|organise|exam prep|revision plan|how (to|should i) study)\b",
    re.I,
)


def _intent(message: str) -> str:
    text = message.strip()
    if not text:
        return "general"
    if GREETING_TRIGGERS.search(text):
        return "chat"
    if YOUTUBE_TRIGGERS.search(text):
        return "youtube"
    if PLAN_TRIGGERS.search(text):
        return "plan"
    if EXPLAIN_TRIGGERS.search(text):
        return "explain"
    if SEARCH_TRIGGERS.search(text):
        return "search"
    if "?" in text:
        return "explain"
    return "general"


def _clean_query(message: str) -> str:
    q = message.strip()
    for prefix in (
        r"^(can you |could you |please |help me )",
        r"^(search for |find |look up |lookup )",
        r"^(explain |summarize |summarise |what is |what are |define )",
        r"^(show me |get me )?(youtube )?(videos? on |videos? about |tutorials? (on|about) )",
    ):
        q = re.sub(prefix, "", q, flags=re.I).strip()
    q = q.rstrip("?.!")
    return q or message.strip()


def _search_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            rows = list(ddgs.text(query, max_results=max_results))
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            }
            for r in rows
            if r.get("href")
        ]
    except Exception:
        return []


def _search_youtube(query: str, max_results: int = 5) -> list[dict[str, str]]:
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            rows = list(ddgs.videos(f"{query} study tutorial", max_results=max_results))
        out = []
        for r in rows:
            url = r.get("content") or r.get("embed_url") or ""
            if not url:
                continue
            out.append(
                {
                    "title": r.get("title", "Video"),
                    "url": url,
                    "publisher": r.get("publisher", ""),
                    "duration": r.get("duration", ""),
                    "thumbnail": r.get("images", {}).get("large")
                    if isinstance(r.get("images"), dict)
                    else "",
                }
            )
        return out
    except Exception:
        return []


def _wikipedia_summary(query: str) -> tuple[str, list[str]]:
    try:
        import wikipedia

        wikipedia.set_lang("en")
        search_hits = wikipedia.search(query, results=3)
        if not search_hits:
            return "", []
        title = search_hits[0]
        page = wikipedia.page(title, auto_suggest=False)
        summary = wikipedia.summary(title, sentences=6, auto_suggest=False)
        tags = [w.replace("_", " ") for w in page.categories[:4] if "wiki" not in w.lower()][:4]
        if not tags:
            tags = title.split()[:3]
        return summary, tags
    except Exception:
        return "", []


def _study_plan_reply(topic: str) -> str:
    subject = topic or "your topic"
    return (
        f"Here is a focused study plan for **{subject}**:\n\n"
        "1. **Preview (15 min)** — Skim headings, key terms, and learning objectives.\n"
        "2. **Active learning (45 min)** — Take notes in your own words; use the Feynman technique "
        "(explain aloud as if teaching a friend).\n"
        "3. **Practice (30 min)** — Do problems, flashcards, or a short quiz on what you just learned.\n"
        "4. **Break (10 min)** — Step away; hydration helps retention.\n"
        "5. **Review (20 min)** — Summarize the session in 5 bullet points; note what is still unclear.\n\n"
        "Repeat this cycle 2–3 times per week, spacing sessions across days (spaced repetition). "
        "Ask me to *explain* a concept or *find videos* when you hit a difficult section."
    )


def _optional_llm(message: str, context: str) -> str | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        import json
        import urllib.request

        payload = {
            "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are Scholar AI, a concise academic study companion for university students. "
                        "Explain clearly, use short paragraphs and bullet points when helpful, "
                        "and suggest next study steps. Do not make up citations."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Context from tools:\n{context}\n\nStudent question: {message}",
                },
            ],
            "max_tokens": 600,
            "temperature": 0.5,
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def chat(message: str) -> dict[str, Any]:
    message = (message or "").strip()
    if not message:
        return {
            "reply": "Type a question, topic, or search query to get started.",
            "status": "",
            "tags": [],
            "youtube": [],
            "search_results": [],
        }

    intent = _intent(message)
    query = _clean_query(message)
    youtube: list[dict[str, str]] = []
    search_results: list[dict[str, str]] = []
    tags: list[str] = []
    status = ""
    reply_parts: list[str] = []
    context_parts: list[str] = []

    if intent == "chat":
        return {
            "reply": "Hi! I am doing well and ready to help. Ask me to explain a topic, create a study plan, search for sources, or find videos when you need them.",
            "status": "",
            "tags": ["Study helper"],
            "youtube": [],
            "search_results": [],
        }

    if intent in ("explain", "youtube", "search"):
        status = "Researching your topic…"
        summary, tags = _wikipedia_summary(query)
        if summary:
            reply_parts.append(summary)
            context_parts.append(f"Wikipedia: {summary}")

    if intent == "youtube":
        status = status or "Finding study videos…"
        youtube = _search_youtube(query)
        if youtube:
            context_parts.append("Videos: " + ", ".join(v["title"] for v in youtube[:3]))

    if intent == "search":
        status = status or "Searching the web…"
        search_results = _search_web(query)
        if search_results:
            context_parts.append(
                "Web: " + "; ".join(f"{r['title']}: {r['snippet'][:120]}" for r in search_results[:3])
            )

    if intent == "plan":
        status = "Building a study plan…"
        reply_parts.append(_study_plan_reply(query))

    llm_reply = _optional_llm(message, "\n".join(context_parts))
    if llm_reply:
        reply = llm_reply
    elif reply_parts:
        reply = reply_parts[0]
        if intent == "youtube" and youtube:
            reply += "\n\nI found these videos that may help your study session:"
        elif intent == "search" and search_results:
            reply += "\n\nHere are some sources to explore:"
    else:
        if youtube:
            reply = f"Here are study videos related to **{query}**:"
        elif search_results:
            reply = f"Here are web results for **{query}**:"
        else:
            api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENROUTER_API_KEY")
            if not api_key:
                reply = (
                    f"I couldn't research \"{query}\" because no AI API keys are configured. "
                    "If you are the administrator, please set the **OPENAI_API_KEY** or **OPENROUTER_API_KEY** "
                    "environment variables in your deployment dashboard."
                )
            else:
                reply = (
                    f"I could not find detailed information on \"{query}\" right now. "
                    "This can happen if the search tools are blocked or the topic is too obscure. "
                    "Try rephrasing or using a more specific subject name."
                )

    if intent == "plan" and not tags:
        tags = ["Study plan", "Spaced repetition", "Active recall"]

    return {
        "reply": reply,
        "status": status,
        "tags": tags,
        "youtube": youtube,
        "search_results": search_results,
    }

def scan_file_for_topic(file_bytes: bytes, mime_type: str) -> tuple[str, str]:
    """Scans a file (PDF or image) and returns the extracted context and a detected topic."""
    context_text = ""
    
    if mime_type == "application/pdf":
        try:
            import PyPDF2
            import io
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages[:10]:  # Limit to first 10 pages for scanning
                context_text += (page.extract_text() or "") + "\n"
        except Exception as e:
            context_text = f"Failed to extract text from PDF: {e}"
    elif mime_type.startswith("image/"):
        import base64
        import json
        import urllib.request
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            return "Image provided, but no API key to process it.", "Uploaded Image"
            
        b64_image = base64.b64encode(file_bytes).decode('utf-8')
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract the main text from this image and provide a concise summary or transcript. Also, at the very end, add a new line with 'TOPIC: <main topic>'."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}}
                    ]
                }
            ],
            "max_tokens": 1000
        }
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(payload).encode(),
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode())
                context_text = data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            context_text = f"Failed to extract text from Image: {e}"

    if not context_text.strip():
        return "No text extracted.", "Uploaded File"
        
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    topic = "Uploaded Document"
    if api_key:
        if "TOPIC:" in context_text:
            parts = context_text.split("TOPIC:")
            topic = parts[-1].strip().split('\n')[0].strip(' *"')
        else:
            prompt = f"Identify the single most specific main topic (1-4 words) from the following text. Only output the topic, no other text:\n\n{context_text[:2000]}"
            llm_reply = _optional_llm(prompt, "")
            if llm_reply:
                topic = llm_reply.strip(' *"')
    
    return context_text, topic

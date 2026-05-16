"""Reusable AI orchestration with caching and fallback."""
from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from study_backend.config import settings


@dataclass(slots=True)
class CacheEntry:
    expires_at: float
    value: dict[str, Any]


_CACHE: dict[str, CacheEntry] = {}


def _cache_key(task: str, payload: dict[str, Any]) -> str:
    return json.dumps({"task": task, "payload": payload}, sort_keys=True, default=str)


def _get_cached(key: str) -> dict[str, Any] | None:
    entry = _CACHE.get(key)
    if entry and entry.expires_at > time.time():
        return entry.value
    if entry:
        _CACHE.pop(key, None)
    return None


def _set_cached(key: str, value: dict[str, Any], ttl_seconds: int = 900) -> None:
    _CACHE[key] = CacheEntry(expires_at=time.time() + ttl_seconds, value=value)


def _heuristic_payload(task: str, payload: dict[str, Any]) -> dict[str, Any]:
    if task == "insight":
        return {
            "insights": [
                {
                    "title": "Peak study window",
                    "message": "You retain more when you start before noon and keep sessions under 50 minutes.",
                    "metric": "Morning sessions show the strongest focus trend.",
                    "severity": "info",
                },
                {
                    "title": "Fatigue risk",
                    "message": "Performance dips after long late sessions. Schedule recall-heavy work earlier.",
                    "metric": "Late sessions correlate with slower quiz answers.",
                    "severity": "warning",
                },
            ]
        }
    if task == "flashcards":
        topic = payload["topic"]
        count = payload["count"]
        return {
            "cards": [
                {
                    "front": f"What is the key idea behind {topic}?",
                    "back": f"{topic} is best remembered by linking the definition, process, and one real example.",
                    "mnemonic": f"Anchor {topic} to one rule and one example.",
                }
                for _ in range(count)
            ]
        }
    if task == "plan":
        weak_topics = payload.get("weak_topics") or ["your weakest topic"]
        hours = payload.get("available_hours", 2)
        return {
            "schedule": [
                {
                    "day": "Today",
                    "focus": weak_topics[0],
                    "hours": min(hours, 2),
                    "mode": "active recall + quiz",
                },
                {
                    "day": "Tomorrow",
                    "focus": "Revision and spaced flashcards",
                    "hours": max(1, round(hours / 2, 1)),
                    "mode": "flashcards + summary notes",
                },
            ],
            "guidance": {
                "burnout_guardrail": "Keep each deep block under 50 minutes and insert a 10-minute reset.",
                "priority_rule": "Do weak-topic work before easy revision.",
            },
        }
    if task == "performance":
        return {
            "performance": {
                "weakFutureTopics": ["Conceptual physics", "Reaction mechanisms"],
                "examReadiness": 76,
                "idealStudyDuration": 45,
                "bestStudyTiming": "morning",
                "predictedDeclineRisk": 28,
            }
        }
    if task == "burnout":
        return {
            "fatigueLevel": "medium",
            "burnoutRisk": 41,
            "recommendedAction": "take_break",
            "frustrationIndex": 33,
        }
    if task == "focus_analysis":
        return {
            "analysis": {
                "focusQuality": 81,
                "cognitiveEngagement": 78,
                "distractedSessions": 2,
                "deepThinkingPattern": "Best focus appears in 35-50 minute blocks.",
            }
        }
    if task == "recommendation":
        return {
            "recommendations": [
                {
                    "recommendedTopic": "Organic Chemistry",
                    "reason": "Accuracy dropped after longer sessions.",
                    "recommendedSessionLength": 45,
                    "priority": 1,
                },
                {
                    "recommendedTopic": "Physics recall review",
                    "reason": "Response time slows under fatigue.",
                    "recommendedSessionLength": 30,
                    "priority": 2,
                },
            ]
        }
    if task == "notes":
        content = payload["content"]
        sentences = [s.strip() for s in content.split(".") if s.strip()]
        return {
            "summary": ". ".join(sentences[:2])[:320],
            "key_points": [s[:120] for s in sentences[:4]],
            "revision_prompts": [f"Explain: {payload['title']}", "Teach this concept in your own words."],
        }
    if task == "concept_map":
        topic = str(payload.get("topic", "Topic")).strip() or "Topic"
        lower_topic = topic.lower()
        if any(word in lower_topic for word in ["math", "algebra", "calculus", "geometry", "statistics"]):
            branches = ["Core formulas", "Worked examples", "Problem solving", "Common errors", "Revision loop"]
        elif any(word in lower_topic for word in ["physics", "chemistry", "biology", "medicine", "anatomy", "photo", "plant"]):
            branches = ["Key concepts", "Processes", "Diagrams", "Experiments", "Review questions"]
        elif any(word in lower_topic for word in ["history", "world war", "war", "economics", "politics", "psychology", "sociology"]):
            branches = ["Causes", "Major events", "Key figures", "Consequences", "Revision questions"]
        elif any(word in lower_topic for word in ["programming", "coding", "computer", "algorithm", "data"]):
            branches = ["Syntax", "Core structures", "Examples", "Debugging", "Projects"]
        else:
            tokens = [
                token
                for token in re.findall(r"[A-Za-z][A-Za-z0-9+-]{2,}", topic)
                if token.lower() not in {"the", "and", "for", "with", "from", "about", "into", "unit", "topic"}
            ]
            seed = tokens[:3] or [topic]
            branches = [
                f"{seed[0]} basics",
                f"{seed[-1]} examples",
                f"{topic} practice",
                f"{topic} review",
                f"{seed[0]} questions",
            ]

        clean_topic = re.sub(r"\s+", " ", topic).strip()
        node_ids = ["core"] + [f"branch_{i}" for i in range(len(branches))]
        nodes = [{"id": "core", "label": clean_topic, "type": "core"}]
        nodes.extend(
            {"id": node_ids[i + 1], "label": label, "type": "support" if i < 2 else "branch"}
            for i, label in enumerate(branches)
        )
        edges = [
            {"source": "core", "target": node_ids[1], "label": "start here"},
            {"source": "core", "target": node_ids[2], "label": "build on"},
            {"source": node_ids[1], "target": node_ids[3], "label": "practice"},
            {"source": node_ids[2], "target": node_ids[4], "label": "apply"},
            {"source": node_ids[4], "target": node_ids[5], "label": "review"},
        ]
        if len(node_ids) > 6:
            edges.append({"source": node_ids[3], "target": node_ids[6], "label": "extend"})
        return {"nodes": nodes, "edges": edges}
    return {}


def _call_openai_model(task: str, prompt: str, schema_hint: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    body = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an adaptive study intelligence engine. "
                    "Respond with valid JSON only, matching the requested structure."
                ),
            },
            {"role": "user", "content": f"{prompt}\n\nSchema:\n{schema_hint}\n\nInput:\n{json.dumps(payload)}"},
        ],
        "temperature": 0.3,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                response_data = json.loads(response.read().decode())
            content = response_data["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.strip("`")
                content = content.replace("json", "", 1).strip()
            return json.loads(content)
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
            if attempt == 2:
                break
            time.sleep(1.2 * (attempt + 1))
    return None


def _call_model(task: str, prompt: str, schema_hint: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.openrouter_api_key:
        return None

    body = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an adaptive study intelligence engine. "
                    "Respond with valid JSON only, matching the requested structure."
                ),
            },
            {"role": "user", "content": f"{prompt}\n\nSchema:\n{schema_hint}\n\nInput:\n{json.dumps(payload)}"},
        ],
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_app_name,
    }

    for model in settings.default_models:
        body["model"] = model
        request = urllib.request.Request(
            settings.openrouter_base_url,
            data=json.dumps(body).encode(),
            headers=headers,
            method="POST",
        )
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    response_data = json.loads(response.read().decode())
                content = response_data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.strip("`")
                    content = content.replace("json", "", 1).strip()
                return json.loads(content)
            except (urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
                if attempt == 2:
                    break
                time.sleep(1.2 * (attempt + 1))
    return None


def structured_completion(task: str, prompt: str, schema_hint: str, payload: dict[str, Any]) -> dict[str, Any]:
    key = _cache_key(task, payload)
    cached = _get_cached(key)
    if cached:
        return cached

    result = (
        _call_model(task, prompt, schema_hint, payload)
        or _call_openai_model(task, prompt, schema_hint, payload)
        or _heuristic_payload(task, payload)
    )
    _set_cached(key, result)
    return result

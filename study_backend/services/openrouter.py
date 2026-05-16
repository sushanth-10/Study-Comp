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
        return {
            "id": "root",
            "label": topic,
            "type": "level1",
            "description": f"A focused study path for {topic}.",
            "children": [
                {
                    "id": "fundamentals",
                    "label": "Fundamentals",
                    "type": "level2",
                    "description": "Learn the base meaning, vocabulary, and purpose first.",
                    "children": [
                        {"id": "basics", "label": f"{topic} Basics", "type": "level3", "description": "Write a short definition and simple example.", "children": []},
                        {"id": "terms", "label": "Key Terms", "type": "level3", "description": "List the words you must remember.", "children": []},
                        {"id": "summary", "label": "Quick Summary", "type": "level3", "description": "Explain the idea in your own words.", "children": []},
                    ],
                },
                {
                    "id": "core",
                    "label": "Core Ideas",
                    "type": "level2",
                    "description": "Break the topic into the main concepts that usually appear in questions.",
                    "children": [
                        {"id": "principles", "label": "Main Principles", "type": "level3", "description": "Study the rules and patterns.", "children": []},
                        {"id": "mechanics", "label": "How It Works", "type": "level3", "description": "Trace the step-by-step process.", "children": []},
                        {"id": "examples", "label": "Examples", "type": "level3", "description": "Connect the concept to solved examples.", "children": []},
                    ],
                },
                {
                    "id": "practice",
                    "label": "Practice",
                    "type": "level2",
                    "description": "Use questions to turn understanding into recall.",
                    "children": [
                        {"id": "easy", "label": "Easy Questions", "type": "level3", "description": "Start with direct recall.", "children": []},
                        {"id": "mixed", "label": "Mixed Review", "type": "level3", "description": "Combine old and new ideas.", "children": []},
                        {"id": "timed", "label": "Timed Test", "type": "level3", "description": "Check speed and accuracy.", "children": []},
                    ],
                },
                {
                    "id": "revision",
                    "label": "Revision",
                    "type": "level2",
                    "description": "Revisit mistakes until the topic is exam ready.",
                    "children": [
                        {"id": "flashcards", "label": "Flashcards", "type": "level3", "description": "Review key terms daily.", "children": []},
                        {"id": "mistakes", "label": "Mistake Log", "type": "level3", "description": "Fix repeated weak points.", "children": []},
                        {"id": "checklist", "label": "Final Checklist", "type": "level3", "description": "Confirm every section is complete.", "children": []},
                    ],
                },
            ],
        }

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

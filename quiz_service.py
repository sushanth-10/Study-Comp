"""Generate multiple-choice quizzes from a topic and difficulty level."""
import json
import os
import random
import re
from typing import Any

DIFFICULTIES = {"easy", "moderate", "hard"}
LABELS = ["A", "B", "C", "D"]


def _clamp_count(count: int) -> int:
    return max(10, min(30, int(count)))


def _wiki_material(topic: str) -> tuple[str, list[str]]:
    try:
        import wikipedia

        wikipedia.set_lang("en")
        hits = wikipedia.search(topic, results=1)
        if not hits:
            return topic, []
        title = hits[0]
        page = wikipedia.page(title, auto_suggest=True)
        raw = page.summary + "\n" + page.content[:12000]
        raw = re.sub(r"==+[^=]+==+", " ", raw)
        raw = re.sub(r"\[\d+\]", "", raw)
        raw = re.sub(r"\s+", " ", raw).strip()
        sentences = [
            s.strip()
            for s in re.split(r"(?<=[.!?])\s+", raw)
            if 50 <= len(s.strip()) <= 280 and not s.strip().startswith("(")
        ]
        return page.title, sentences
    except Exception:
        return topic, []


def _distractors(correct: str, pool: list[str], n: int = 3) -> list[str]:
    candidates = [s for s in pool if s != correct and len(s) > 20]
    random.shuffle(candidates)
    picks = candidates[:n]
    while len(picks) < n:
        picks.append(
            random.choice(
                [
                    "This statement is inaccurate for the topic described.",
                    "The opposite relationship is generally accepted instead.",
                    "This applies to a different field, not the topic at hand.",
                    "Research does not support this claim in this context.",
                ]
            )
        )
    return picks[:n]


def _negate_sentence(sentence: str) -> str:
    replacements = [
        (r"\bis\b", "is not"),
        (r"\bare\b", "are not"),
        (r"\bwas\b", "was not"),
        (r"\bwere\b", "were not"),
        (r"\bcan\b", "cannot"),
        (r"\bwill\b", "will not"),
        (r"\bincludes\b", "excludes"),
        (r"\bcauses\b", "does not cause"),
        (r"\bincreases\b", "decreases"),
    ]
    out = sentence
    for pat, rep in replacements:
        if re.search(pat, out, re.I):
            out = re.sub(pat, rep, out, count=1, flags=re.I)
            break
    else:
        out = "It is false that " + sentence[0].lower() + sentence[1:] if sentence else sentence
    return out


def _questions_from_wikipedia(
    topic: str, difficulty: str, count: int
) -> list[dict[str, Any]]:
    title, sentences = _wiki_material(topic)
    if len(sentences) < 4:
        return []

    if difficulty == "easy":
        pool = sentences[: max(len(sentences) // 2, 8)]
    elif difficulty == "hard":
        pool = sentences[max(len(sentences) // 4, 0) :]
    else:
        mid = len(sentences) // 3
        pool = sentences[mid : mid + max(len(sentences) // 2, 8)]

    random.shuffle(pool)
    questions: list[dict[str, Any]] = []
    used: set[str] = set()

    templates_easy = [
        "Which statement about {title} is correct?",
        "Regarding {title}, which of the following is true?",
    ]
    templates_mod = [
        "Which best describes an important aspect of {title}?",
        "In the study of {title}, which statement is most accurate?",
    ]
    templates_hard = [
        "Which of the following is NOT a valid statement about {title}?",
        "Advanced review ({title}): which option is correct?",
    ]

    tmpl = {
        "easy": templates_easy,
        "moderate": templates_mod,
        "hard": templates_hard,
    }[difficulty]

    for sent in pool:
        if len(questions) >= count or sent in used:
            continue
        used.add(sent)

        if difficulty == "hard" and len(questions) % 3 == 2:
            wrong = _negate_sentence(sent)
            options = [wrong, sent] + _distractors(sent, pool, 2)
            question_text = f"Which statement about {title} is incorrect?"
            random.shuffle(options)
            correct_index = options.index(wrong)
        else:
            question_text = random.choice(tmpl).format(title=title)
            options = [sent] + _distractors(sent, pool, 3)
            correct_index = 0
            random.shuffle(options)
            correct_index = options.index(sent)

        questions.append(
            {
                "question": question_text,
                "options": options[:4],
                "correct_index": correct_index,
                "explanation": f"This reflects established information about {title}.",
            }
        )

    # Fill with term-blank style if we need more
    idx = 0
    while len(questions) < count and idx < len(pool):
        sent = pool[idx]
        idx += 1
        words = [w for w in re.findall(r"\b[A-Za-z]{5,}\b", sent) if w.lower() not in ("which", "their", "there")]
        if not words:
            continue
        term = random.choice(words[:6] if len(words) > 6 else words)
        blanked = sent.replace(term, "______", 1)
        if blanked == sent:
            continue
        options = [term] + [w for w in words if w != term][:3]
        while len(options) < 4:
            options.append("None of the above")
        random.shuffle(options)
        questions.append(
            {
                "question": f"Fill in the blank about {title}: {blanked}",
                "options": options[:4],
                "correct_index": options.index(term),
                "explanation": f"The missing term is related to core ideas in {title}.",
            }
        )

    return questions[:count]


def _generate_llm(topic: str, difficulty: str, count: int) -> list[dict[str, Any]] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    diff_guide = {
        "easy": "basic definitions, key terms, and straightforward facts suitable for beginners",
        "moderate": "application, comparisons, and relationships between concepts",
        "hard": "analysis, edge cases, exceptions, and multi-step reasoning",
    }[difficulty]

    import urllib.request

    prompt = f"""Create exactly {count} multiple-choice questions for a university student studying "{topic}".
Difficulty: {difficulty} — {diff_guide}.

Return ONLY a JSON array (no markdown fences). Each element:
{{"question": "string", "options": ["A","B","C","D"], "correct_index": 0-3, "explanation": "brief"}}

Rules:
- Exactly 4 options per question, all plausible
- correct_index is 0-based index of the correct option
- Questions must be distinct and about {topic}
- Match {difficulty} difficulty throughout"""

    payload = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": "You output valid JSON only for educational quizzes."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": min(8000, 180 * count + 400),
        "temperature": 0.7,
    }

    try:
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode())
        content = data["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = re.sub(r"^```\w*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        items = json.loads(content)
        return _normalize_questions(items, count)
    except Exception:
        return None


def _normalize_questions(items: list, count: int) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        opts = item.get("options") or []
        if len(opts) < 4:
            continue
        opts = [str(o) for o in opts[:4]]
        ci = int(item.get("correct_index", 0))
        ci = max(0, min(3, ci))
        q = str(item.get("question", "")).strip()
        if not q:
            continue
        out.append(
            {
                "question": q,
                "options": opts,
                "correct_index": ci,
                "explanation": str(item.get("explanation", "")).strip(),
            }
        )
        if len(out) >= count:
            break
    return out


def _generic_questions(topic: str, difficulty: str, count: int) -> list[dict[str, Any]]:
    """Last-resort questions when Wikipedia has little content."""
    base = [
        (
            f"What is the primary focus when studying {topic}?",
            [
                f"Understanding core concepts and principles of {topic}",
                f"Memorizing unrelated historical dates only",
                f"Avoiding all practice problems",
                f"Skipping review entirely",
            ],
            0,
        ),
        (
            f"Which study strategy is most effective for {topic} at {difficulty} level?",
            [
                "Active recall and spaced practice",
                "Only re-reading notes without testing",
                "Cramming once with no review",
                "Ignoring difficult sections",
            ],
            0,
        ),
    ]
    questions = []
    for i in range(count):
        tpl = base[i % len(base)]
        opts = tpl[1][:]
        random.shuffle(opts)
        correct = tpl[1][tpl[2]]
        questions.append(
            {
                "question": tpl[0] + (f" (Q{i + 1})" if i >= len(base) else ""),
                "options": opts,
                "correct_index": opts.index(correct),
                "explanation": f"Effective study of {topic} requires active engagement.",
            }
        )
    return questions


def generate_quiz(topic: str, difficulty: str, count: int = 15) -> dict[str, Any]:
    topic = (topic or "").strip()
    if len(topic) < 2:
        raise ValueError("Topic must be at least 2 characters.")

    difficulty = (difficulty or "moderate").lower()
    if difficulty not in DIFFICULTIES:
        raise ValueError("Difficulty must be easy, moderate, or hard.")

    count = _clamp_count(count)

    questions = _generate_llm(topic, difficulty, count)
    source = "ai"

    if not questions or len(questions) < 10:
        wiki_q = _questions_from_wikipedia(topic, difficulty, count)
        if len(wiki_q) >= 10:
            questions = wiki_q
            source = "wikipedia"
        elif questions:
            questions = questions + wiki_q
            questions = questions[:count]
            source = "mixed"
        else:
            questions = wiki_q

    if len(questions) < 10:
        generic = _generic_questions(topic, difficulty, count - len(questions))
        questions = (questions or []) + generic
        source = "mixed" if questions else "template"

    questions = questions[:count]
    random.shuffle(questions)

    return {
        "topic": topic,
        "difficulty": difficulty,
        "count": len(questions),
        "source": source,
        "questions": questions,
    }

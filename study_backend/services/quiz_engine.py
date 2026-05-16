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


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip().lower()


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = _normalize_text(item)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(str(item).strip())
    return result


def _unique_options(correct: str, candidates: list[str], topic: str = "") -> list[str]:
    options = [str(correct).strip()] + [str(candidate).strip() for candidate in candidates]
    options = _dedupe_preserve_order(options)

    fillers = _dedupe_preserve_order([
        f"A key idea connected to {topic or 'the topic'}.",
        f"A supporting example from {topic or 'the topic'}.",
        f"An important detail about {topic or 'the topic'}.",
        f"A common misconception about {topic or 'the topic'}.",
        "A broader concept that is not the best answer here.",
    ])
    while len(options) < 4 and fillers:
        candidate = fillers.pop(0)
        if _normalize_text(candidate) not in {_normalize_text(item) for item in options}:
            options.append(candidate)

    return options[:4]


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
    correct_norm = _normalize_text(correct)
    candidates = [s for s in pool if _normalize_text(s) != correct_norm and len(s) > 20]
    random.shuffle(candidates)
    picks = _dedupe_preserve_order(candidates)[:n]
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
            options = _unique_options(wrong, [sent] + _distractors(sent, pool, 2), title)
            question_text = f"Which statement about {title} is incorrect?"
            random.shuffle(options)
            correct_index = options.index(wrong)
        else:
            question_text = random.choice(tmpl).format(title=title)
            options = _unique_options(sent, _distractors(sent, pool, 3), title)
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
        options = _unique_options(term, [w for w in words if _normalize_text(w) != _normalize_text(term)], title)
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


def _context_sentences(context: str) -> list[str]:
    raw = re.sub(r"\s+", " ", context or "").strip()
    return [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", raw)
        if 45 <= len(s.strip()) <= 260
    ]


def _questions_from_context(topic: str, difficulty: str, count: int, context: str) -> list[dict[str, Any]]:
    sentences = _context_sentences(context)
    if len(sentences) < 3:
        return []
    random.shuffle(sentences)
    questions: list[dict[str, Any]] = []
    used: set[str] = set()
    cursor = 0
    while len(questions) < count and cursor < count * 2:
        sent = sentences[cursor % len(sentences)]
        cursor += 1
        if _normalize_text(sent) in used:
            continue
        used.add(_normalize_text(sent))
        words = [
            w for w in re.findall(r"\b[A-Za-z][A-Za-z\-]{4,}\b", sent)
            if w.lower() not in {"which", "their", "there", "about", "these", "those", "because", "should"}
        ]
        focus_words = [w for w in words if len(w) > 5][:4]
        if difficulty == "easy" and words:
            term = random.choice(words[:8])
            blanked = sent.replace(term, "______", 1)
            options = _unique_options(term, [w for w in words if _normalize_text(w) != _normalize_text(term)], topic)
            random.shuffle(options)
            questions.append({
                "question": f"From the uploaded material on {topic}, which term best completes this point: {blanked}",
                "options": options[:4],
                "correct_index": options[:4].index(term),
                "explanation": f"The uploaded document states this point using the term {term}.",
            })
        elif focus_words:
            anchor = random.choice(focus_words)
            options = _unique_options(anchor, [w for w in focus_words if _normalize_text(w) != _normalize_text(anchor)], topic)
            random.shuffle(options)
            questions.append({
                "question": f"According to the uploaded material, which statement about {topic} is most accurate?",
                "options": options[:4],
                "correct_index": options[:4].index(anchor),
                "explanation": "This answer is taken from the uploaded document context.",
            })
    return questions[:count]


def _to_new_format(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Converts questions to the format requested by the user."""
    new_questions = []
    labels = ["A", "B", "C", "D"]
    for q in questions:
        # Handle both old and new format during transition if needed
        if isinstance(q.get("options"), dict):
            new_questions.append(q)
            continue
            
        opts = q.get("options", [])
        if len(opts) < 4:
            continue
        new_opts = {labels[i]: opts[i] for i in range(4)}
        
        # Determine correct letter
        if "correct" in q:
            correct_letter = q["correct"]
        else:
            correct_idx = q.get("correct_index", 0)
            correct_letter = labels[correct_idx] if 0 <= correct_idx < 4 else "A"
            
        new_questions.append({
            "question": q["question"],
            "options": new_opts,
            "correct": correct_letter
        })
    return new_questions


def _generate_llm(topic: str, difficulty: str, count: int, context: str = "") -> list[dict[str, Any]] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    context_block = f"\n\nTopic Content/Context:\n{context[:4000]}\n" if context.strip() else ""

    prompt = f"""Generate exactly {count} multiple-choice questions for the topic: "{topic}".
Difficulty: {difficulty}

Rules:
- Questions must test subject knowledge, not study habits or learning strategies.
- Stay strictly within the topic content.
- Do NOT ask about "best way to study", "learning methods", "study techniques", or general educational advice.
- Questions should involve concepts, definitions, formulas, applications, or problem-solving from the topic.
- Each question must have exactly 4 options (A, B, C, D).
- Only one correct answer.
- Include the correct answer separately.
- Return JSON only.

{context_block}

Format:
{{
  "questions": [
    {{
      "question": "...",
      "options": {{
        "A":"...",
        "B":"...",
        "C":"...",
        "D":"..."
      }},
      "correct":"B"
    }}
  ]
}}"""

    payload = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": "You are a subject matter expert. You output valid JSON quizzes based on the requested rules."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": min(12000, 250 * count + 500),
        "temperature": 0.5,
    }

    try:
        import urllib.request
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
        
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "questions" in parsed:
            items = parsed["questions"]
        elif isinstance(parsed, list):
            items = parsed
        else:
            return None
            
        return _to_new_format(items[:count])
    except Exception:
        return None


def _generic_questions(topic: str, difficulty: str, count: int) -> list[dict[str, Any]]:
    """Last-resort questions that adhere to subject knowledge rules."""
    base = [
        (
            f"Which of the following is a fundamental concept related to {topic}?",
            [
                f"The core principles defining {topic}",
                "A concept completely unrelated to the field",
                "A generic statement with no scientific basis",
                "None of the above",
            ],
            0,
        ),
        (
            f"What is a primary characteristic of {topic}?",
            [
                f"Its unique properties and functional role",
                "It has no identifiable characteristics",
                "It is always identical to other unrelated topics",
                "It only exists in theoretical discussions",
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
                "question": tpl[0],
                "options": opts,
                "correct_index": opts.index(correct),
                "explanation": f"This covers basic knowledge of {topic}.",
            }
        )
    return questions


def generate_quiz(topic: str, difficulty: str, count: int = 15, context: str = "") -> dict[str, Any]:
    topic = (topic or "").strip()
    if len(topic) < 2:
        raise ValueError("Topic must be at least 2 characters.")

    difficulty = (difficulty or "moderate").lower()
    if difficulty not in DIFFICULTIES:
        raise ValueError("Difficulty must be easy, moderate, or hard.")

    count = _clamp_count(count)

    questions: list[dict[str, Any]] = []
    source = "template"

    if context.strip():
        # Document scanning
        llm_q = _generate_llm(topic, difficulty, count, context)
        if llm_q:
            questions = llm_q
            source = "document+ai"
        else:
            context_q = _questions_from_context(topic, difficulty, count, context)
            questions = _to_new_format(context_q)
            source = "document"
    else:
        # General AI search
        llm_q = _generate_llm(topic, difficulty, count, context)
        if llm_q:
            questions = llm_q
            source = "ai"
        else:
            wiki_q = _questions_from_wikipedia(topic, difficulty, count)
            questions = _to_new_format(wiki_q)
            source = "wikipedia"

    if len(questions) < 5:
        generic = _generic_questions(topic, difficulty, count - len(questions))
        questions = questions + _to_new_format(generic)
        source = "fallback"

    random.shuffle(questions)
    questions = questions[:count]

    return {
        "topic": topic,
        "difficulty": difficulty,
        "count": len(questions),
        "source": source,
        "questions": questions,
    }


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


def _finalize_questions(items: list[dict[str, Any]], count: int) -> list[dict[str, Any]]:
    seen_questions: set[str] = set()
    seen_signatures: set[tuple[str, tuple[str, ...]]] = set()
    output: list[dict[str, Any]] = []
    for item in items:
        question = str(item.get("question", "")).strip()
        options = _dedupe_preserve_order([str(opt) for opt in item.get("options", []) if str(opt).strip()])
        if len(options) < 4 or not question:
            continue
        if item.get("correct_index", 0) >= len(options):
            continue
        signature = (_normalize_text(question), tuple(_normalize_text(option) for option in options))
        if signature in seen_signatures or _normalize_text(question) in seen_questions:
            continue
        seen_questions.add(_normalize_text(question))
        seen_signatures.add(signature)
        output.append({
            "question": question,
            "options": options[:4],
            "correct_index": int(item.get("correct_index", 0)),
            "explanation": str(item.get("explanation", "")).strip(),
        })
        if len(output) >= count:
            break
    return output


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


def _generate_llm(topic: str, difficulty: str, count: int, context: str = "") -> list[dict[str, Any]] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    diff_guide = {
        "easy": "basic definitions, key terms, and straightforward facts suitable for beginners",
        "moderate": "application, comparisons, and relationships between concepts",
        "hard": "analysis, edge cases, exceptions, and multi-step reasoning",
    }[difficulty]

    import urllib.request

    context_block = f"\n\nSource Material / Context to base questions on:\n{context[:3000]}\n" if context.strip() else ""

    prompt = f"""Create exactly {count} multiple-choice questions for a university student studying "{topic}".
Difficulty: {difficulty} — {diff_guide}.{context_block}

Return ONLY a JSON array (no markdown fences). Each element:
{{"question": "string", "options": ["A","B","C","D"], "correct_index": 0-3, "explanation": "brief"}}

Rules:
- Exactly 4 options per question, all plausible
- correct_index is 0-based index of the correct option
- Questions must be distinct, directly about {topic}, and must not repeat wording or answer choices
- Prefer source material from the uploaded context when provided; do not invent unrelated topics
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
        opts = _dedupe_preserve_order([str(o) for o in opts[:4]])
        if len(opts) < 4:
            continue
        ci = int(item.get("correct_index", 0))
        ci = max(0, min(3, ci))
        q = str(item.get("question", "")).strip()
        if not q:
            continue
        if _normalize_text(q) in {_normalize_text(existing["question"]) for existing in out}:
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
    return _finalize_questions(out, count)


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
        context_q = _questions_from_context(topic, difficulty, count, context)
        questions = context_q[:]
        source = "document"
        if len(questions) < count:
            llm_q = _generate_llm(topic, difficulty, count, context) or []
            questions = _finalize_questions(questions + llm_q, count)
            if llm_q:
                source = "document+ai"
        if len(questions) < 10:
            generic = _generic_questions(topic, difficulty, count - len(questions))
            questions = _finalize_questions(questions + generic, count)
            if generic:
                source = "document+fallback"
    else:
        questions = _generate_llm(topic, difficulty, count, context) or []
        source = "ai" if questions else "template"
        if len(questions) < 10:
            wiki_q = _questions_from_wikipedia(topic, difficulty, count)
            questions = _finalize_questions(questions + wiki_q, count)
            if wiki_q:
                source = "wikipedia" if not questions else "mixed"
        if len(questions) < 10:
            generic = _generic_questions(topic, difficulty, count - len(questions))
            questions = _finalize_questions(questions + generic, count)
            if generic:
                source = "mixed"

    questions = _finalize_questions(questions, count)
    random.shuffle(questions)

    return {
        "topic": topic,
        "difficulty": difficulty,
        "count": len(questions),
        "source": source,
        "questions": questions,
    }

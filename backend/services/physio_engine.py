from __future__ import annotations


EXERCISE_LIBRARY = {
    "head": [
        {"name": "Eye Focus Reset", "category": "mobility", "hold_seconds": 20},
        {"name": "Jaw Relaxation", "category": "mobility", "hold_seconds": 15},
        {"name": "Temple Massage Breathing", "category": "mobility", "hold_seconds": 30},
    ],
    "neck": [
        {"name": "Chin Tucks", "category": "gentle", "hold_seconds": 5},
        {"name": "Neck Rotation", "category": "gentle", "hold_seconds": 10},
        {"name": "Levator Stretch", "category": "mobility", "hold_seconds": 20},
        {"name": "Isometric Neck Hold", "category": "strength", "hold_seconds": 8},
    ],
    "shoulder": [
        {"name": "Pendulum Swing", "category": "gentle", "hold_seconds": 20},
        {"name": "Wall Slides", "category": "mobility", "hold_seconds": 5},
        {"name": "External Rotation", "category": "mobility", "hold_seconds": 5},
        {"name": "Scaption Raise", "category": "strength", "hold_seconds": 3},
    ],
    "back": [
        {"name": "Cat-Cow", "category": "gentle", "hold_seconds": 5},
        {"name": "Pelvic Tilts", "category": "gentle", "hold_seconds": 5},
        {"name": "Bird-Dog", "category": "mobility", "hold_seconds": 6},
        {"name": "Bridge", "category": "strength", "hold_seconds": 8},
    ],
    "elbow": [
        {"name": "Elbow Flexion Stretch", "category": "gentle", "hold_seconds": 10},
        {"name": "Pronation-Supination", "category": "mobility", "hold_seconds": 10},
        {"name": "Biceps Isometric Hold", "category": "strength", "hold_seconds": 8},
    ],
    "wrist": [
        {"name": "Wrist Circles", "category": "gentle", "hold_seconds": 10},
        {"name": "Prayer Stretch", "category": "mobility", "hold_seconds": 20},
        {"name": "Grip Squeeze", "category": "strength", "hold_seconds": 5},
    ],
    "hip": [
        {"name": "Hip Circles", "category": "gentle", "hold_seconds": 10},
        {"name": "Hip Flexor Stretch", "category": "mobility", "hold_seconds": 20},
        {"name": "Clamshell", "category": "mobility", "hold_seconds": 5},
        {"name": "Glute Bridge", "category": "strength", "hold_seconds": 8},
    ],
    "knee": [
        {"name": "Quad Sets", "category": "gentle", "hold_seconds": 8},
        {"name": "Heel Slides", "category": "gentle", "hold_seconds": 5},
        {"name": "Straight Leg Raise", "category": "mobility", "hold_seconds": 5},
        {"name": "Step-Ups", "category": "strength", "hold_seconds": 3},
    ],
    "ankle": [
        {"name": "Ankle Alphabet", "category": "gentle", "hold_seconds": 20},
        {"name": "Calf Stretch", "category": "mobility", "hold_seconds": 20},
        {"name": "Towel Curls", "category": "mobility", "hold_seconds": 10},
        {"name": "Single-Leg Balance", "category": "strength", "hold_seconds": 15},
    ],
}


def _normalize_body_part(body_part: str) -> str:
    normalized = body_part.lower().strip()

    if "shoulder" in normalized:
        return "shoulder"
    if "back" in normalized:
        return "back"
    if "elbow" in normalized:
        return "elbow"
    if "wrist" in normalized:
        return "wrist"
    if "hip" in normalized:
        return "hip"
    if "knee" in normalized:
        return "knee"
    if "ankle" in normalized:
        return "ankle"
    if "neck" in normalized:
        return "neck"
    if "head" in normalized:
        return "head"

    return normalized


def get_rehab_exercises(body_part: str, severity: str, week: int = 1) -> list[dict]:
    library_key = _normalize_body_part(body_part)
    exercises = EXERCISE_LIBRARY.get(library_key, EXERCISE_LIBRARY["back"])

    if severity == "severe":
        allowed_categories = {"gentle"}
    elif severity == "moderate":
        allowed_categories = {"gentle", "mobility"}
    else:
        allowed_categories = {"gentle", "mobility", "strength"}

    if week >= 4:
        allowed_categories.add("strength")
    elif week >= 2 and severity != "severe":
        allowed_categories.add("mobility")

    selected_exercises = [
        exercise for exercise in exercises if exercise["category"] in allowed_categories
    ]

    sets = 2 if week == 1 else 3
    reps = 8 if severity == "severe" else 10 + min(max(week - 1, 0), 2) * 2

    return [
        {
            "name": exercise["name"],
            "sets": sets,
            "reps": reps,
            "hold_seconds": exercise["hold_seconds"],
            "video_url": "",
        }
        for exercise in selected_exercises
    ]
import json
import os
import uuid
import hashlib
import hmac
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"
MOODS_FILE = DATA_DIR / "moods.json"
JOURNALS_FILE = DATA_DIR / "journals.json"
PREFERENCES_FILE = DATA_DIR / "preferences.json"


def _ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: list[dict]):
    _ensure_data_dir()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
    return hashed, salt


def register_user(email: str, password: str) -> dict | None:
    users = _read_json(USERS_FILE)
    if any(u["email"] == email.lower() for u in users):
        return None

    hashed, salt = _hash_password(password)
    user = {
        "id": str(uuid.uuid4()),
        "email": email.lower().strip(),
        "password_hash": hashed,
        "salt": salt,
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
    }
    users.append(user)
    _write_json(USERS_FILE, users)
    return {"id": user["id"], "email": user["email"], "role": user["role"]}


def verify_user(email: str, password: str) -> dict | None:
    users = _read_json(USERS_FILE)
    user = next((u for u in users if u["email"] == email.lower()), None)
    if not user:
        return None

    hashed, _ = _hash_password(password, user["salt"])
    if not hmac.compare_digest(hashed, user["password_hash"]):
        return None

    return {"id": user["id"], "email": user["email"], "role": user["role"]}


# --- Moods ---

def add_mood(user_id: str, value: int, note: str | None) -> dict:
    moods = _read_json(MOODS_FILE)
    mood = {
        "id": len(moods) + 1,
        "user_id": user_id,
        "value": value,
        "note": note,
        "created_at": datetime.utcnow().isoformat(),
    }
    moods.append(mood)
    _write_json(MOODS_FILE, moods)
    return mood


def get_moods(user_id: str, limit: int = 50, start: str | None = None, end: str | None = None) -> list[dict]:
    moods = _read_json(MOODS_FILE)
    result = [m for m in moods if m["user_id"] == user_id]
    if start:
        result = [m for m in result if m["created_at"] >= start]
    if end:
        result = [m for m in result if m["created_at"] <= end]
    result.sort(key=lambda m: m["created_at"], reverse=True)
    return result[:limit]


# --- Journals ---

def add_journal(user_id: str, content: str, sentiment: str) -> dict:
    journals = _read_json(JOURNALS_FILE)
    entry = {
        "id": len(journals) + 1,
        "user_id": user_id,
        "content": content,
        "sentiment": sentiment,
        "created_at": datetime.utcnow().isoformat(),
    }
    journals.append(entry)
    _write_json(JOURNALS_FILE, journals)
    return entry


def get_journals(user_id: str, limit: int = 50, start: str | None = None, end: str | None = None) -> list[dict]:
    journals = _read_json(JOURNALS_FILE)
    result = [j for j in journals if j["user_id"] == user_id]
    if start:
        result = [j for j in result if j["created_at"] >= start]
    if end:
        result = [j for j in result if j["created_at"] <= end]
    result.sort(key=lambda j: j["created_at"], reverse=True)
    return result[:limit]


# --- Preferences ---

def get_preferences(user_id: str) -> dict:
    prefs = _read_json(PREFERENCES_FILE)
    pref = next((p for p in prefs if p["user_id"] == user_id), None)
    if pref:
        return pref
    now = datetime.utcnow().isoformat()
    pref = {
        "user_id": user_id,
        "theme": "system",
        "notifications_enabled": True,
        "show_onboarding": True,
        "created_at": now,
        "updated_at": now,
    }
    prefs.append(pref)
    _write_json(PREFERENCES_FILE, prefs)
    return pref


def update_preferences(user_id: str, updates: dict) -> dict:
    prefs = _read_json(PREFERENCES_FILE)
    idx = next((i for i, p in enumerate(prefs) if p["user_id"] == user_id), None)
    if idx is None:
        pref = get_preferences(user_id)
        prefs = _read_json(PREFERENCES_FILE)
        idx = next(i for i, p in enumerate(prefs) if p["user_id"] == user_id)

    for k, v in updates.items():
        if v is not None:
            prefs[idx][k] = v
    prefs[idx]["updated_at"] = datetime.utcnow().isoformat()
    _write_json(PREFERENCES_FILE, prefs)
    return prefs[idx]

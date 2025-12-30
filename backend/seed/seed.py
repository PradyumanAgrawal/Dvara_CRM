import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

TOKEN_PATTERN = re.compile(r"\{\{([A-Z0-9_]+)\}\}")


def resolve_token(token: str) -> str:
    if token.endswith("_UID"):
        env_key = f"SEED_{token}"
        env_value = os.getenv(env_key)
        if not env_value:
            raise ValueError(f"Missing env var {env_key} for placeholder {{{{{token}}}}}.")
        return env_value

    if token == "TODAY":
        return date.today().isoformat()

    if token.startswith("TODAY_PLUS_"):
        days = int(token.replace("TODAY_PLUS_", ""))
        return (date.today() + timedelta(days=days)).isoformat()

    if token.startswith("TODAY_MINUS_"):
        days = int(token.replace("TODAY_MINUS_", ""))
        return (date.today() - timedelta(days=days)).isoformat()

    return f"{{{{{token}}}}}"


def resolve_value(value):
    if isinstance(value, dict):
        return {key: resolve_value(val) for key, val in value.items()}
    if isinstance(value, list):
        return [resolve_value(item) for item in value]
    if isinstance(value, str) and "{{" in value:
        return TOKEN_PATTERN.sub(lambda match: resolve_token(match.group(1)), value)
    return value


DATE_TOKEN = re.compile(r"^\{\{TODAY(?P<offset>[+-]\d+)?\}\}$")


def _collect_placeholders(value, keys, found):
    if isinstance(value, dict):
        for item in value.values():
            _collect_placeholders(item, keys, found)
        return
    if isinstance(value, list):
        for item in value:
            _collect_placeholders(item, keys, found)
        return
    if isinstance(value, str) and value in keys:
        found.add(value)


def _apply_replacements(value, placeholders):
    if isinstance(value, dict):
        return {key: _apply_replacements(val, placeholders) for key, val in value.items()}
    if isinstance(value, list):
        return [_apply_replacements(item, placeholders) for item in value]
    if isinstance(value, str):
        replacement = placeholders.get(value)
        if replacement:
            return replacement
        match = DATE_TOKEN.match(value)
        if match:
            offset = int(match.group("offset") or 0)
            return (date.today() + timedelta(days=offset)).isoformat()
        return value
    return value


def _delete_collection(db, collection_name, batch_size=400):
    total_deleted = 0
    while True:
        docs = list(db.collection(collection_name).limit(batch_size).stream())
        if not docs:
            break
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        total_deleted += len(docs)
    return total_deleted


def main() -> None:
    seed_path = Path(__file__).parent / "seed.json"
    payload = json.loads(seed_path.read_text())
    payload = resolve_value(payload)

    placeholders = {
        "OFFICER_UID": os.getenv("SEED_OFFICER_UID") or os.getenv("OFFICER_UID"),
        "OFFICER_TWO_UID": os.getenv("SEED_OFFICER_TWO_UID") or os.getenv("OFFICER_TWO_UID"),
        "MANAGER_UID": os.getenv("SEED_MANAGER_UID") or os.getenv("MANAGER_UID"),
        "ADMIN_UID": os.getenv("SEED_ADMIN_UID") or os.getenv("ADMIN_UID")
    }
    payload = _apply_replacements(payload, placeholders)
    missing_keys = {key for key, value in placeholders.items() if not value}
    if missing_keys:
        remaining = set()
        _collect_placeholders(payload, missing_keys, remaining)
        if remaining:
            print(
                "Warning: missing UID env vars for "
                + ", ".join(sorted(remaining))
                + ". Seed data will use placeholder values."
            )

    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    collections = list(payload.get("collections", {}).keys())
    for collection in collections:
        deleted = _delete_collection(db, collection)
        print(f"Cleared {deleted} docs from {collection}.")

    if "--clear-only" in sys.argv or os.getenv("SEED_CLEAR_ONLY") == "1":
        print("Clear-only mode enabled. Skipping seed inserts.")
        return

    for collection, docs in payload.get("collections", {}).items():
        for entry in docs:
            doc_id = entry["id"]
            data = entry["data"]
            db.collection(collection).document(doc_id).set(data)


if __name__ == "__main__":
    main()

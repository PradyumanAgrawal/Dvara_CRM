import json
import os
import re
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


def main() -> None:
    seed_path = Path(__file__).parent / "seed.json"
    payload = json.loads(seed_path.read_text())
    payload = resolve_value(payload)

    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    for collection, docs in payload.get("collections", {}).items():
        for entry in docs:
            doc_id = entry["id"]
            data = entry["data"]
            db.collection(collection).document(doc_id).set(data)


if __name__ == "__main__":
    main()

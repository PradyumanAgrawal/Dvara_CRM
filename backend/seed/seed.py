import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


def main() -> None:
    seed_path = Path(__file__).parent / "seed.json"
    payload = json.loads(seed_path.read_text())

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

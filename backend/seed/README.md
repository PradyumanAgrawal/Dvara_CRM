# Seed Data

## Quick Start
1. Create a Firebase Auth user and copy the UID.
2. Replace `OFFICER_UID` in `seed.json` with that UID.
3. Ensure Application Default Credentials are available:
   - `gcloud auth application-default login`
   - or set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key.
4. Install Python deps:
   - `pip install firebase-admin`
5. Run the seed script:
   - `python backend/seed/seed.py`

## Notes
- Seed data is intentionally minimal to validate branch scoping and core flows.
- Extend the JSON with more collections as needed.

# Dvara CRM

Dvara is a Firebase-first CRM built for field teams. The stack is Vite + React + TypeScript on the frontend, with Firestore, Auth, and Storage on the backend.

## Repo Structure
- `frontend/` - Vite + React app
- `backend/` - Firestore rules, indexes, storage rules, and seed data
- `plan.md` - Build checklist
- `backend.md` / `frontend.md` - Architecture and implementation notes

## Prerequisites
- Node.js 18+
- pnpm
- Firebase CLI (`npm i -g firebase-tools`)
- Python 3.10+ (for optional seeding)

## Firebase Project
This repo targets the `dvara-crm` Firebase project.

```bash
firebase use dvara-crm
```

## Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

Environment variables live in `frontend/.env` and map to the Firebase web app config:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Rules and Indexes
Deploy Firestore and Storage rules/indexes from `backend/`:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Hosting
```bash
cd frontend
pnpm build
cd ..
firebase deploy --only hosting
```

## Seed Data (Optional)
Seed data lives in `backend/seed/seed.json`. To seed Firestore:

```bash
# Requires application default credentials
# gcloud auth application-default login
python3 backend/seed/seed.py
```

The seed file uses placeholders for role-specific UIDs and rolling dates. Set the UID
environment variables before running the script:

```bash
export SEED_ADMIN_UID="uid-from-firebase-auth"
export SEED_MANAGER_UID="uid-from-firebase-auth"
export SEED_OFFICER_1_UID="uid-from-firebase-auth"
export SEED_OFFICER_2_UID="uid-from-firebase-auth"
export SEED_EAST_MANAGER_UID="uid-from-firebase-auth"
export SEED_EAST_OFFICER_UID="uid-from-firebase-auth"
python3 backend/seed/seed.py
```

Date placeholders like `{{TODAY_MINUS_3}}` or `{{TODAY_PLUS_2}}` are resolved at runtime
so reports and follow-ups always show recent activity.

## Notes
- Workflow automation runs client-side and writes to `automation_logs`.
- Cloud Functions are optional and not required for the current build.

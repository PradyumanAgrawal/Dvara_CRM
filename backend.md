# Backend Plan (Dvara - Firebase Functions - Python)

## Product Name
- Dvara

## Scope
- Keep data and workflows in Firestore wherever possible.
- Use Cloud Functions only for server-only tasks or integrity guardrails.
- Cloud Functions use Python runtime (2nd gen) with Firebase Admin SDK.

## Firebase Services
- Auth: email/password login (username/password) and role claims.
- Firestore: source of truth for CRM data.
- Functions: minimal automation and server-side actions.
- Storage: RFP and invoice attachments.
- Hosting: frontend app delivery (handled in frontend plan).

## Project Configuration (dvara-crm)
- `.firebaserc` sets the default project to `dvara-crm`.
- `firebase.json` wires Firestore rules and indexes to:
  - `backend/firestore.rules`
  - `backend/firestore.indexes.json`
- Deploy rules/indexes with:
  - `firebase deploy --only firestore:rules,firestore:indexes`

## Priority Order (Build First -> Later)
Focus on quick, working flows with minimal Functions.

### P0: Foundation
- Enable Email/Password Auth in Firebase console.
- Apply Firestore rules and indexes for branch-scoped data access.
- Finalize interlinked schema fields and naming (IDs only).
- Define minimal seed data for one branch and one officer.

### P1: Core CRM Data
- CRUD for `primary_people` and `households`.
- CRUD for `products`, `interactions`, `tasks`.
- Client-side batch writes for:
  - Person + household create.
  - Interaction with follow-up task creation.
- Queries for dashboards and "pending follow-ups".

### P2: Standard CRM Features
- CRUD for `opportunities`, `meetings`, `phone_calls`, `rfps`, `invoices`.
- Storage paths for RFP and invoice attachments.

### P3: Minimal Functions (Only if needed)
- `sync_user_role_claims` for role + branch claims.
- `generate_invoice_pdf` for server-side invoice PDF.
- Optional guardrail triggers if client writes miss required tasks.

## Suggested Backend Layout
- `backend/functions/main.py` - entry point for functions.
- `backend/functions/requirements.txt` - Python deps (firebase-admin, functions-framework).
- `backend/functions/src/` - helpers (auth, firestore, validators).
- `backend/firestore.rules` - security rules.
- `backend/firestore.indexes.json` - composite indexes.

## Firestore Collections (interlinked, low redundancy)
Shared fields on most docs: `created_at`, `updated_at`, `created_by`, `branch`,
`assigned_officer_id` (as applicable).

Relationship fields store IDs only. Avoid duplicating names or profile data across
collections; resolve display values in the client.

- `primary_people`
  - core profile fields from `vision.md`
  - `risk_flags` (array)
  - `pgpd_stage` (Plan / Grow / Protect / Diversify)
  - `risk_status` (At Risk / Normal)
- `households`
  - lightweight context fields from `vision.md`
  - `primary_person_id`
- `products`
  - `product_type`, `status`, `amount`, `primary_person_id`
- `interactions`
  - `interaction_type`, `interaction_date`, `outcome`, `next_action_date`
  - `primary_person_id`, `linked_product_id`
- `tasks`
  - `task_title`, `due_date`, `status`, `linked_interaction_id`
  - `task_type` (FollowUp / SuggestedInteraction / System)
  - `source_ref` (doc path that triggered the task)
- `opportunities`
  - `stage`, `value`, `owner_user_id`, `primary_person_id` (optional)
- `meetings`
  - `scheduled_at`, `location`, `notes`, `attendee_ids`
- `phone_calls`
  - `call_time`, `duration`, `outcome`, `notes`, `primary_person_id`
- `rfps`
  - `status`, `due_date`, `attachments` (Storage paths), `primary_person_id` (optional)
- `invoices`
  - `status`, `amount`, `line_items`, `pdf_path`, `primary_person_id` (optional)
- `users`
  - `role` (Admin / BranchManager / FieldOfficer), `branch`, `display_name`

## Functions (Python)

### Minimal Functions (required)
- `generate_invoice_pdf` (HTTPS callable)
  - Create a PDF (server-side) and store in Storage.
  - Update `invoices/{id}.pdf_path`.
- `sync_user_role_claims` (HTTPS callable)
  - Set Auth custom claims from `users` doc.

### Optional Guardrails (only if needed)
Prefer client-side batch writes to create tasks and set fields. These functions should
only backfill when a required field or task is missing.
- `on_primary_person_create` (Firestore onCreate)
  - Set `pgpd_stage = Plan` if missing.
  - Create task "Initial financial assessment visit" if missing.
- `on_primary_person_update` (Firestore onUpdate)
  - If `risk_flags` changed from empty to non-empty:
    - Set `risk_status = At Risk`.
    - Create task "Insurance discussion" if missing.
- `on_product_write` (Firestore onWrite)
  - If `product_type = Loan` AND `status = Active`:
    - Create task "Business / income review" if missing.
  - If `status` changed to `Closed`:
    - Create task "Savings / pension conversation" if missing.
- `on_interaction_write` (Firestore onWrite)
  - If `outcome = Follow-up Required` and task missing:
    - Create task with `due_date = next_action_date`.

### Idempotency Rules
- Use deterministic `task_type + source_ref` to prevent duplicate system tasks.
- Use Firestore transactions for all automation writes.

## Security Rules (Summary)
- All reads/writes require authenticated users.
- Branch-scoped access: `doc.branch == request.auth.token.branch`.
- Only Admins can modify `users` and set roles.
- Clients cannot write server-managed fields (`risk_status`, system tasks).
- Auth uses email/password login for all roles.

## Security Rules (Concrete Outline)
Rules should be explicit about auth, branch scoping, and server-managed fields.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function hasRole(role) {
      return request.auth.token.role == role;
    }
    function sameBranch(resourceData) {
      return request.auth.token.branch == resourceData.branch;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && hasRole("Admin");
      allow write: if isSignedIn() && hasRole("Admin");
    }

    match /{collection}/{docId} {
      allow read: if isSignedIn() && sameBranch(resource.data);
      allow create, update, delete: if isSignedIn() && sameBranch(request.resource.data);
    }
  }
}
```

Notes:
- Block writes to server-managed fields in client code (and optionally add
  validation in Functions for guardrails).
- Set custom claims for `role` and `branch` via `sync_user_role_claims`.

## Storage
- Store attachments under paths:
  - `rfps/{rfpId}/...`
  - `invoices/{invoiceId}/...`
- Include metadata in Firestore for quick lookup.

## Indexes (Core Queries)
- `interactions` by `primary_person_id` + `interaction_date`.
- `tasks` by `assigned_officer` + `status` + `due_date`.
- `primary_people` by `branch` + `pgpd_stage`.
- `products` by `primary_person_id` + `status`.

## Indexes (Concrete Definition)
Add indexes in `backend/firestore.indexes.json` for the following queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "primary_person_id", "order": "ASCENDING" },
        { "fieldPath": "interaction_date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assigned_officer_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "due_date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "primary_people",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branch", "order": "ASCENDING" },
        { "fieldPath": "pgpd_stage", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "primary_person_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Local Dev and Deploy (Notes)
- Use Firebase emulators for Auth, Firestore, Functions.
- Deploy with Firebase CLI for Functions and Firestore rules.

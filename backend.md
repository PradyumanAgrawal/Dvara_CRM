# Backend Plan (Dvara - Firebase Functions - Python)

## Product Name
- Dvara

## Scope
- Firestore is the source of truth; keep workflows client-side wherever possible.
- Use Cloud Functions only for server-only tasks or integrity guardrails.
- Cloud Functions use Python runtime (2nd gen) with Firebase Admin SDK when added.

## Firebase Services
- Auth: email/password login (username/password).
- Roles/branch stored in Firestore `users` docs (custom claims optional).
- Firestore: source of truth for CRM data.
- Functions: minimal automation and server-side actions (optional).
- Storage: RFP and invoice attachments.
- Hosting: frontend app delivery (handled in frontend plan).

## Project Configuration (dvara-crm)
- `.firebaserc` sets the default project to `dvara-crm`.
- `firebase.json` wires Firestore and Storage rules/indexes to:
  - `backend/firestore.rules`
  - `backend/firestore.indexes.json`
  - `backend/storage.rules`
- Deploy rules/indexes with:
  - `firebase deploy --only firestore:rules,firestore:indexes,storage`

## Priority Order (Build First -> Later)
Focus on quick, working flows with minimal Functions.

### P0: Foundation
- [x] Enable Email/Password Auth in Firebase console.
- [x] Apply Firestore rules and indexes for branch-scoped data access.
- [x] Finalize interlinked schema fields and naming (IDs only).
- [x] Define minimal seed data for one branch and one officer.
- [x] Store role/branch in `users/{uid}` profile docs.

### P1: Core CRM Data
- [x] Create/list for `primary_people` and `households` (batch write on create).
- [x] Edit flows for `primary_people` and `households`.
- [x] Delete flows for `primary_people` and `households`.
- [x] Create/list for `products`, `interactions`, `tasks`.
- [x] Edit/delete flows for `products`, `interactions`, `tasks`.
- [x] Client-side batch writes for:
  - Person + household create.
  - Interaction with follow-up task creation.
- [x] Queries for dashboards and pending follow-ups.

### P2: Standard CRM Features
- [x] CRUD for `opportunities`, `meetings`, `phone_calls`, `rfps`, `invoices`.
- [x] Storage paths for RFP and invoice attachments.

### P3: Minimal Functions (Only if needed)
- [ ] `sync_user_role_claims` for role + branch claims.
- [ ] `generate_invoice_pdf` for server-side invoice PDF.
- [ ] Optional guardrail triggers if client writes miss required tasks.

## Suggested Backend Layout
- `backend/functions/main.py` - entry point for functions.
- `backend/functions/requirements.txt` - Python deps (firebase-admin, functions-framework).
- `backend/functions/src/` - helpers (auth, firestore, validators).
- `backend/firestore.rules` - security rules.
- `backend/firestore.indexes.json` - composite indexes.
- `backend/storage.rules` - storage rules for attachments.

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
  - `product_name`, `product_type`, `status`, `amount`, `primary_person_id`
- `interactions`
  - `interaction_title`, `interaction_type`, `interaction_date`, `outcome`, `next_action_date`
  - `primary_person_id`, `linked_product_id`
- `tasks`
  - `task_title`, `due_date`, `status`, `linked_interaction_id`
  - `task_type` (FollowUp / SuggestedInteraction / System)
  - `primary_person_id`
  - `source_ref` (doc path that triggered the task)
- `opportunities`
  - `opportunity_name`, `stage`, `value`, `owner_user_id`, `primary_person_id` (optional)
- `meetings`
  - `meeting_title`, `scheduled_at`, `location`, `notes`, `attendee_ids`
- `phone_calls`
  - `call_time`, `duration`, `outcome`, `notes`, `primary_person_id`
- `rfps`
  - `rfp_title`, `status`, `due_date`, `notes`
  - `primary_person_id` (optional)
  - `attachment_name`, `attachment_path`, `attachment_url`
- `invoices`
  - `invoice_title`, `status`, `amount`
  - `primary_person_id` (optional)
  - `attachment_name`, `attachment_path`, `attachment_url`
- `users`
  - `role` (Admin / BranchManager / FieldOfficer), `branch`, `display_name`, `email`
- `automation_logs`
  - `action`, `source_ref`, `branch`, `created_by`, `details`, `created_at`

## Automation (Client-side)
- Automation runs in the client to minimize Functions.
- Each automation writes a record in `automation_logs` for traceability.

## Functions (Python)

### Minimal Functions (optional)
- `generate_invoice_pdf` (HTTPS callable)
  - Create a PDF (server-side) and store in Storage.
  - Update `invoices/{id}.attachment_path` and `attachment_url`.
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
- Use Firestore transactions for all automation writes (if moved to Functions).

## Security Rules (Summary)
- All reads/writes require authenticated users.
- Branch-scoped access: `doc.branch == users/{uid}.branch`.
- Users can read/write their own profile; Admins can manage any profile.
- Deletes allowed for same-branch documents.
- Clients avoid writing server-managed fields (`risk_status`, system tasks).

## Security Rules (Concrete Outline)
Rules should be explicit about auth, branch scoping, and server-managed fields.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    function userRole() {
      return userDoc().role;
    }
    function userBranch() {
      return userDoc().branch;
    }
    function sameBranch(resourceData) {
      return userBranch() == resourceData.branch;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (userId == request.auth.uid || userRole() == "Admin");
      allow create: if isSignedIn() && userId == request.auth.uid;
      allow update: if isSignedIn() && (userId == request.auth.uid || userRole() == "Admin");
      allow delete: if isSignedIn() && userRole() == "Admin";
    }

    match /{collection}/{docId} {
      allow read: if isSignedIn() && sameBranch(resource.data);
      allow create, update: if isSignedIn() && sameBranch(request.resource.data);
      allow delete: if isSignedIn() && sameBranch(resource.data);
    }
  }
}
```

Notes:
- Block writes to server-managed fields in client code (and optionally add
  validation in Functions for guardrails).
- Set custom claims for `role` and `branch` via `sync_user_role_claims` if desired.

## Storage
- Store attachments under paths:
  - `rfps/{rfpId}/...`
  - `invoices/{invoiceId}/...`
- Include `attachment_name`, `attachment_path`, and `attachment_url` in Firestore docs.

## Indexes (Core Queries)
- `interactions` by `primary_person_id` + `interaction_date`.
- `interactions` by `branch` + `interaction_date` (dashboard activity).
- `tasks` by `assigned_officer_id` + `status` + `due_date`.
- `tasks` by `branch` + `status` (dashboard queues).
- `primary_people` by `branch` + `pgpd_stage`.
- `primary_people` by `branch` + `risk_status`.
- `products` by `primary_person_id` + `status`.
- `products` by `branch` + `product_type` + `status`.
- `households` by `branch` + `primary_person_id`.

## Indexes (Concrete Definition)
See `backend/firestore.indexes.json` for the exact deployed indexes.

## Local Dev and Deploy (Notes)
- Use Firebase emulators for Auth, Firestore, and Storage.
- Deploy with Firebase CLI for Firestore rules/indexes and Storage rules.

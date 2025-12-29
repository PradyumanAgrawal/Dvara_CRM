# Firebase Build Plan (Dvara KGFS CRM)

## Goals
- Build the CRM in Firebase end-to-end (Auth, Firestore, Functions, Hosting, Storage).
- Keep the system lean, workflow-led, and aligned with PGPD.

## Architecture (Firebase-only)
- [x] Create Firebase project and enable required services (Auth, Firestore, Functions, Hosting, Storage).
- [x] Choose client stack (Web app + Firebase SDK).
- [x] Define environment config for dev/prod (Firebase project IDs, API keys).
- [x] Set up Hosting with SPA routing.
- [x] Set up Functions for workflow automation and triggers (implemented client-side to minimize Functions).
- [x] Configure Storage for document uploads (if needed for RFPs, invoices, attachments).

## Data Model (Firestore)
- [x] `primary_people` collection with fields from the spec.
- [x] `households` collection for lightweight context.
- [x] `products` collection linked to `primary_people`.
- [x] `interactions` collection linked to `primary_people` and optional `products`.
- [x] `tasks` collection linked to `interactions`.
- [x] `opportunities` collection (for generic CRM requirement).
- [x] `meetings` collection (calendar/logs).
- [x] `phone_calls` collection (call logs).
- [x] `rfps` collection (RFP tracking).
- [x] `invoices` collection (invoice generation and storage).

## Roles and Access (Firebase Auth + Rules)
- [x] Enable email/password or phone auth (field officers).
- [x] Define roles: Admin, Branch Manager, Field Officer.
- [x] Store role/branch on user profile.
- [x] Firestore rules: branch-scoped access for data entities.
- [ ] Functions to validate role changes and sensitive updates.

## Core CRM Features (Checklist)

### Identity and Context
- [x] Create primary person profile.
- [x] Edit primary person details.
- [x] Capture household context on create.
- [x] Edit household context.
- [x] View profile with linked products, interactions, and tasks.

### Financial Relationships
- [x] Create product records (loan/insurance/savings/pension).
- [x] Update product status (active/closed/renewal due).
- [x] View product history per person.

### Interactions (Most Important)
- [x] Log interaction with type, date, outcome, notes.
- [x] Link interaction to primary person and optional product.
- [x] Capture next action date.
- [x] List and filter interactions by outcome and officer.

### Tasks (Lightweight Follow-through)
- [x] Auto-create tasks for follow-ups.
- [x] View open tasks by officer.
- [x] Mark tasks done.

### Workflow Automation (Firebase Functions)
- [x] On primary person create -> set PGPD stage to Plan.
- [x] On primary person create -> create "Initial financial assessment visit" task.
- [x] On active loan product -> suggest "Business / income review" interaction.
- [x] On risk flag added -> create "Insurance discussion" interaction (as suggested task).
- [x] On risk flag added -> highlight "At Risk" in dashboard.
- [x] On stable interactions or loan completed -> suggest "Savings / pension conversation".
- [x] On interaction outcome "Follow-up Required" -> create task.

### Standard CRM Requirements
- [x] Opportunities tracking (pipeline stage, value, owner).
- [x] Meetings management (schedule, notes, attendees).
- [x] Phone call logs (date, duration, outcome).
- [x] RFP tracking (status, due dates, attachments).
- [x] Invoice generation (status, amount, storage).

## UI / Screens (Web App)
- [x] Login and role-aware navigation.
- [x] Dashboard (at-risk list, pending follow-ups, key stats).
- [x] Primary person profile view (summary + related entities).
- [x] Create screens for each entity.
- [x] Edit screens for each entity.
- [x] Delete actions for each entity (row actions + confirm).
- [x] Search and filters (by village, branch, officer, PGPD stage).

## Reporting (Lightweight)
- [x] Simple counts: active loans, at-risk customers, pending follow-ups.
- [x] Officer activity summary (interactions per week).

## Quality, Security, and Operations
- [x] Firestore indexes for common queries.
- [x] Seed data for demo.
- [x] Logging for workflow triggers.
- [ ] Basic audit logs for critical updates (optional).

## Delivery Checklist
- [x] README with local setup steps.
- [x] Demo script (walkthrough of workflows).
- [ ] Screenshots or short recording (optional).

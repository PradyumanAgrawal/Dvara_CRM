# Firebase Build Plan (Dvara KGFS CRM)

## Goals
- Build the CRM in Firebase end-to-end (Auth, Firestore, Functions, Hosting, Storage).
- Keep the system lean, workflow-led, and aligned with PGPD.

## Architecture (Firebase-only)
- [ ] Create Firebase project and enable required services (Auth, Firestore, Functions, Hosting, Storage).
- [ ] Choose client stack (Web app + Firebase SDK).
- [ ] Define environment config for dev/prod (Firebase project IDs, API keys).
- [ ] Set up Hosting with SPA routing.
- [ ] Set up Functions for workflow automation and triggers.
- [ ] Configure Storage for document uploads (if needed for RFPs, invoices, attachments).

## Data Model (Firestore)
- [ ] `primary_people` collection with fields from the spec.
- [ ] `households` collection for lightweight context.
- [ ] `products` collection linked to `primary_people`.
- [ ] `interactions` collection linked to `primary_people` and optional `products`.
- [ ] `tasks` collection linked to `interactions`.
- [ ] `opportunities` collection (for generic CRM requirement).
- [ ] `meetings` collection (calendar/logs).
- [ ] `phone_calls` collection (call logs).
- [ ] `rfps` collection (RFP tracking).
- [ ] `invoices` collection (invoice generation and storage).

## Roles and Access (Firebase Auth + Rules)
- [ ] Enable email/password or phone auth (field officers).
- [ ] Define roles: Admin, Branch Manager, Field Officer.
- [ ] Store role/branch on user profile.
- [ ] Firestore rules: branch-scoped access for data entities.
- [ ] Functions to validate role changes and sensitive updates.

## Core CRM Features (Checklist)

### Identity and Context
- [ ] Create primary person profile.
- [ ] Edit primary person details.
- [ ] Add and edit household context.
- [ ] View profile with linked products, interactions, and tasks.

### Financial Relationships
- [ ] Create product records (loan/insurance/savings/pension).
- [ ] Update product status (active/closed/renewal due).
- [ ] View product history per person.

### Interactions (Most Important)
- [ ] Log interaction with type, date, outcome, notes.
- [ ] Link interaction to primary person and optional product.
- [ ] Capture next action date.
- [ ] List and filter interactions by outcome and officer.

### Tasks (Lightweight Follow-through)
- [ ] Auto-create tasks for follow-ups.
- [ ] View open tasks by officer.
- [ ] Mark tasks done.

### Workflow Automation (Firebase Functions)
- [ ] On primary person create -> set PGPD stage to Plan.
- [ ] On primary person create -> create "Initial financial assessment visit" task.
- [ ] On active loan product -> suggest "Business / income review" interaction.
- [ ] On risk flag added -> create "Insurance discussion" interaction.
- [ ] On risk flag added -> highlight "At Risk" in dashboard.
- [ ] On stable interactions or loan completed -> suggest "Savings / pension conversation".
- [ ] On interaction outcome "Follow-up Required" -> create task.

### Standard CRM Requirements
- [ ] Opportunities tracking (pipeline stage, value, owner).
- [ ] Meetings management (schedule, notes, attendees).
- [ ] Phone call logs (date, duration, outcome).
- [ ] RFP tracking (status, due dates, attachments).
- [ ] Invoice generation (status, amount, storage).

## UI / Screens (Web App)
- [ ] Login and role-aware navigation.
- [ ] Dashboard (at-risk list, pending follow-ups, key stats).
- [ ] Primary person profile view (summary + related entities).
- [ ] Create/edit screens for each entity.
- [ ] Search and filters (by village, branch, officer, PGPD stage).

## Reporting (Lightweight)
- [ ] Simple counts: active loans, at-risk customers, pending follow-ups.
- [ ] Officer activity summary (interactions per week).

## Quality, Security, and Operations
- [ ] Firestore indexes for common queries.
- [ ] Seed data for demo.
- [ ] Logging for workflow triggers.
- [ ] Basic audit logs for critical updates (optional).

## Delivery Checklist
- [ ] README with local setup steps.
- [ ] Demo script (walkthrough of workflows).
- [ ] Screenshots or short recording (optional).

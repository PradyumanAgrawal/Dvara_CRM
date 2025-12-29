# Frontend Plan (Dvara - Vite + TS + Firebase + shadcn + Magic UI)

## Product Name
- Dvara

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui components (default colorscheme)
- Magic UI component registry for speed (only components built on shadcn)
- Kibo UI-inspired blocks (banner, announcement, dropzone)
- Firebase Auth (email/password), Firestore, Storage

## Firebase Web Config (dvara-crm)
Create a Firebase web app in the `dvara-crm` project and set env vars:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (set to `dvara-crm`)
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

Initialize Firebase in `src/lib/firebase.ts` and export `auth`, `db`, and `storage`.

## Priority Order (Build First -> Later)
Focus on fast delivery with reusable components and minimal custom UI.

### P0: App Shell + Auth
- [x] Landing page with Dvara branding and login CTA.
- [x] Email/password login form with validation.
- [x] First-login profile setup (role + branch).
- [x] App shell layout (sidebar + top bar + breadcrumb).
- [x] Route guards and redirect flow (`/` -> `/login` -> `/app`).

### P1: Core CRUD Templates
- [x] Reusable `ListPage`, `DetailPage`, `FormPage` scaffolds.
- [x] Shared form fields via `FieldRegistry`.
- [x] DataTable wrapper with search + filters.
- [x] Row actions for edit + delete.

### P2: Core CRM Screens
- [x] Primary people list + create + detail flows.
- [x] Primary people edit flow (profile + household + risk flags).
- [x] Primary people delete flow (cascade to linked records).
- [x] Products list/create/edit/delete.
- [x] Interactions list/create/edit/delete.
- [x] Tasks list + status updates + edit/delete.

### P3: Standard CRM Screens
- [x] Opportunities, meetings, phone calls, RFPs, invoices (CRUD).
- [x] File upload UI for RFPs/invoices (Storage + links).
- [x] Reports page with live Firestore counts and officer summary.
- [x] User settings for Admin role (edit roles/branch).

## App Structure
- Landing page for unauthenticated users with a login CTA.
- Auth-guarded SPA with role-aware navigation.
- App shell uses a sidebar for sections and breadcrumbs for subsections.
- Each subsection supports CRUD with reusable page templates.
- Global search and quick actions on lists.

## Routes and Pages

### Public
- `/` - Landing page (redirect to `/app` if logged in).
- `/login` - Email/password login.

### App Shell (auth required)
- `/app` - Dashboard.
- `/app/setup` - Profile setup (role + branch).
- `/app/people` - Primary people list.
- `/app/people/new` - Create primary person.
- `/app/people/:id` - Primary person detail.
- `/app/people/:id/edit` - Edit primary person.

### CRM Features
- `/app/products` - Product list.
- `/app/products/new` - Create product.
- `/app/products/:id/edit` - Edit product.
- `/app/interactions` - Interaction list.
- `/app/interactions/new` - Create interaction.
- `/app/interactions/:id/edit` - Edit interaction.
- `/app/tasks` - Task list.
- `/app/tasks/:id/edit` - Edit task.
- `/app/opportunities` - Pipeline list.
- `/app/opportunities/new` - Create opportunity.
- `/app/opportunities/:id/edit` - Edit opportunity.
- `/app/meetings` - Meetings list.
- `/app/meetings/new` - Create meeting.
- `/app/meetings/:id/edit` - Edit meeting.
- `/app/phone-calls` - Call log list.
- `/app/phone-calls/new` - Create phone call.
- `/app/phone-calls/:id/edit` - Edit phone call.
- `/app/rfps` - RFP tracker list.
- `/app/rfps/new` - Create RFP.
- `/app/rfps/:id/edit` - Edit RFP.
- `/app/invoices` - Invoice list.
- `/app/invoices/new` - Create invoice.
- `/app/invoices/:id/edit` - Edit invoice.
- `/app/reports` - Lightweight metrics.
- `/app/settings/users` - User and role management (Admin only).
- `/app/settings/users/:id/edit` - Edit user.

## User Flow
- Landing page -> Login (if not authenticated).
- Login -> Profile setup (first time) -> App shell with sidebar sections.
- Breadcrumbs guide users through list -> detail -> edit flows.
- CRUD flows are accessible from list action buttons.

## Auth Flow (Email/Password)
- Login uses `signInWithEmailAndPassword`.
- Route guard uses `onAuthStateChanged` and redirects to `/login`.
- If `users/{uid}` is missing, redirect to `/app/setup`.
- Fetch `users/{uid}` after login to load role and branch.
- Logout uses `signOut`.

## Page Flows (Feature Coverage)

### Onboarding -> Plan
- Create Primary Person -> auto task "Initial financial assessment visit".
- Show task in `/tasks` and on the person detail page.

### Credit Active -> Grow
- Add product with type Loan and status Active.
- Suggested task appears: "Business / income review".

### Risk Flag -> Protect
- Edit Primary Person, add risk flag(s).
- Person shows "At Risk" badge.
- Suggested task: "Insurance discussion".

### Stability -> Diversify
- Mark loan as Closed.
- Suggested task: "Savings / pension conversation".

### Follow-up Discipline
- Log interaction with outcome "Follow-up Required" and next action date.
- Task auto-creates with due date.

### Standard CRM Requirements
- Opportunities: create/update pipeline stage and value.
- Meetings: schedule, notes, attendee list.
- Phone calls: log outcomes and notes.
- RFPs: status tracking and attachment upload.
- Invoices: create invoice, upload PDF, store download link.

## UI Components (shadcn)
Use default shadcn styling and tokens.
- Layout: `Card`, `Separator`, `Tabs`, `Badge`, `Breadcrumb`.
- Actions: `Button`.
- Forms: `Form`, `Input`, `Select`, `Textarea`, `Checkbox`.
- Lists: `Table`, `DataTable`, `Pagination`.
- Feedback: `Toast` (optional), `Skeleton`.

## Magic UI Usage
- Landing page uses `Marquee`, `NumberTicker`, and `AnimatedShinyText`.
- Keep variants that use shadcn primitives and default colors.
- Avoid custom color palettes or theme overrides.

## Kibo UI Usage
- `Announcement` for marketing highlights on landing.
- `Banner` for dashboard and landing callouts.
- `Dropzone` for attachment uploads.

## Data Access Patterns
- Use Firebase Auth (email/password) for sessions and `users/{uid}` profile lookup.
- Interlinked Firestore schema: store IDs only, resolve display fields in the client.
- Firestore queries scoped by `branch` and `assigned_officer_id`.
- Real-time listeners for dashboards and task lists.
- Batch writes for multi-entity create flows (person + household + first task).
- Delete flows:
  - `primary_people` deletes cascade to linked records.
  - Other collections delete the current record only.

## Uploads
- RFP and invoice attachments upload to Storage via `Dropzone`.
- Store `attachment_name`, `attachment_path`, and `attachment_url` in Firestore docs.

## Empty and Error States
- Empty list states with CTA buttons.
- Inline error messaging for Firestore failures.

## Quick Development and Reuse
- Use shared page templates for list/detail/edit views.
- Reuse form field components and schemas across entities.
- Keep components thin and data-driven to speed iteration.

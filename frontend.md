# Frontend Plan (Dvara - Vite + TS + Firebase + shadcn + Magic UI)

## Product Name
- Dvara

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui components (default colorscheme)
- Magic UI component registry for speed (only components built on shadcn)
- Firebase Auth (email/password), Firestore, Storage, Functions

## Firebase Web Config (dvara-crm)
Create a Firebase web app in the `dvara-crm` project and set env vars:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (set to `dvara-crm`)
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

Initialize Firebase in `src/lib/firebase.ts` and export `auth`, `db`, `storage`,
and `functions` for reuse.

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

### P2: Core CRM Screens
- [x] Primary people list + create + detail scaffolds.
- [x] Primary people edit flow (profile + household).
- [x] Products list and creation flow.
- [x] Interactions list and creation flow.
- [x] Tasks list + status updates + follow-up visibility.

### P3: Standard CRM Screens
- [x] Opportunities, meetings, phone calls, RFPs, invoices (list + create).
- [ ] File upload UI for RFPs/invoices.
- [x] Reports page with basic counts (static placeholders).

## App Structure
- Landing page for unauthenticated users with a login CTA.
- Auth-guarded SPA with role-aware navigation.
- App shell uses a sidebar for sections and breadcrumbs for subsections.
- Each subsection supports CRUD with reusable page templates.
- Global search and "quick add" actions.

## Routes and Pages

### Public
- `/` - Landing page (redirect to `/app` if logged in).
- `/login` - Email/password login.

### App Shell (auth required)
- `/app` - Dashboard.
- `/app/setup` - Profile setup (role + branch).
- `/app/people` - Primary people list.
- `/app/people/new` - Create primary person.
- `/app/people/:id/edit` - Edit primary person.
- `/app/people/:id` - Primary person detail with tabs:
  - Overview
  - Household
  - Products
  - Interactions
  - Tasks

### CRM Features
- `/app/products` - Product list and filters.
- `/app/interactions` - Interaction log and filters.
- `/app/tasks` - Pending and completed tasks.
- `/app/opportunities` - Pipeline list view (stage, value, owner).
- `/app/meetings` - Meetings list and scheduler view.
- `/app/phone-calls` - Call log list.
- `/app/rfps` - RFP tracker list + detail page.
- `/app/invoices` - Invoice list + detail page.
- `/app/reports` - Lightweight metrics.
- `/app/settings/users` - User and role management (Admin only).

## User Flow
- Landing page -> Login (if not authenticated).
- Login -> Profile setup (first time) -> App shell with sidebar sections.
- Breadcrumbs guide users through list -> detail -> edit flows.

## Auth Flow (Email/Password)
- Login uses `signInWithEmailAndPassword`.
- Route guard uses `onAuthStateChanged` and redirects to `/login`.
- If `users/{uid}` is missing, redirect to `/app/setup`.
- Fetch `users/{uid}` after login to load role and branch.
- Logout uses `signOut`.

## Routing Skeleton (React Router)
Define a reusable route tree to support fast CRUD development.

```tsx
// src/routes.tsx
const routes = [
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "setup", element: <ProfileSetup /> },
      { path: "people", element: <PeopleList /> },
      { path: "people/new", element: <PeopleCreate /> },
      { path: "people/:id", element: <PeopleDetail /> },
      { path: "products", element: <ProductsList /> },
      { path: "interactions", element: <InteractionsList /> },
      { path: "tasks", element: <TasksList /> },
      { path: "opportunities", element: <OpportunitiesList /> },
      { path: "meetings", element: <MeetingsList /> },
      { path: "phone-calls", element: <PhoneCallsList /> },
      { path: "rfps", element: <RfpsList /> },
      { path: "invoices", element: <InvoicesList /> },
      { path: "reports", element: <Reports /> },
      { path: "settings/users", element: <UserSettings /> }
    ]
  }
];
```

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
- Mark loan as Closed or reach stable interaction criteria.
- Suggested task: "Savings / pension conversation".

### Follow-up Discipline
- Log interaction with outcome "Follow-up Required" and next action date.
- Task auto-creates with due date.

### Standard CRM Requirements
- Opportunities: create/update pipeline stage and value.
- Meetings: schedule, notes, attendee list.
- Phone calls: log outcomes and notes.
- RFPs: status tracking and attachment upload.
- Invoices: create invoice, generate PDF, store download link.

## UI Components (shadcn)
Use default shadcn styling and tokens.
- Layout: `Card`, `Separator`, `Tabs`, `Badge`, `Breadcrumb`, `Sheet`.
- Actions: `Button`, `DropdownMenu`, `Dialog`, `AlertDialog`.
- Forms: `Form`, `Input`, `Select`, `Textarea`, `DatePicker`, `Combobox`.
- Lists: `Table`, `DataTable`, `Pagination`, `Command` (global search).
- Feedback: `Toast`, `Tooltip`, `Progress`, `Skeleton`.

## Magic UI Usage
- Use Magic UI registry to pull layout and animation helpers.
- Only keep variants that use shadcn primitives and default colors.
- Avoid custom color palettes or theme overrides.

## Data Access Patterns
- Use Firebase Auth (email/password) for sessions and `users/{uid}` profile lookup.
- Interlinked Firestore schema: store IDs only, resolve display fields in the client.
- Firestore queries scoped by `branch` and `assigned_officer_id`.
- Real-time listeners for dashboards and task lists.
- Batch writes for multi-entity create flows (person + household + first task).

## Forms and Validation
- Use `react-hook-form` + `zod` for validation.
- Validate required fields and date constraints.

## Uploads
- RFP and invoice attachments upload to Storage.
- Store storage paths in Firestore docs.

## Empty and Error States
- Empty list states with CTA buttons.
- Inline error toasts for Firestore/Functions failures.

## Quick Development and Reuse
- Use shared page templates for list/detail/edit views.
- Reuse form field components and schemas across entities.
- Keep components thin and data-driven to speed iteration.

## Reusable Page Templates (CRUD)
- `ListPage` template: toolbar + filters + table + pagination + create CTA.
- `DetailPage` template: header summary + tabs + related entities.
- `FormPage` template: form fields + validation + submit/cancel actions.

## Component Reuse Strategy
- Build a `FieldRegistry` (text, select, date, textarea) for all forms.
- Use a `DataTable` wrapper for common sorting and filtering.
- Keep entity configs in a single map (labels, fields, collection paths).

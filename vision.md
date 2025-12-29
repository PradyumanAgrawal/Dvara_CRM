# Vision

## Task overview
- Each group will design and develop a Customer Relationship Management (CRM) system
  for a company of their choice, selected for the report.
- Analyze the CRM needs of the chosen company and develop a prototype CRM reflecting
  its operations and requirements.
- Include features like Opportunities tracking, Meetings management, Phone calls, RFP
  tracking, and Invoice generation catered to the company analyzed.

## Dvara KGFS - CRM system spec (lean, flow-first)

### 1. System intent (read this first)
This CRM is built to support relationship-led rural finance, not transactional sales.

The system focuses on:
- Who we deal with (Primary Person)
- What financial relationship exists (Product)
- What interactions happen over time (Interactions)
- What actions must follow (Tasks and workflows)

Design choice: We prioritize actionable workflows over exhaustive data capture.

### 2. Core identity model (simplified)
**Identity anchor:** Primary Person

Every relationship is anchored to one primary individual who:
- Is the main borrower or decision maker
- Is the field officer's point of contact
- Is socially recognized in the village

We deliberately avoid complex household identity logic.

### 3. Core entities (minimal but sufficient)

#### 3.1 Primary person (customer)
**Purpose:** Who Dvara interacts with.

**Fields (keep only these):**
- person_id (system-generated)
- full_name
- mobile_number
- village
- branch
- role (Primary Earner / Borrower)
- pgpd_stage (Plan / Grow / Protect / Diversify)
- risk_flags (multi-select)
  - Climate Risk
  - Income Volatility
  - Health Shock Risk
- assigned_officer

Note: This is your customer profile.

#### 3.2 Household (context only)
**Purpose:** Lightweight economic context.

**Fields:**
- household_name (auto: <Person Name> Household)
- primary_person_id
- primary_earning_source (Agriculture / MSME / Wage)
- seasonality_profile (Kharif / Rabi / Perennial)

Note: No identity logic. No validation. Just context.

#### 3.3 Product (financial relationship)
**Purpose:** What financial relationship exists for this person.

**Fields:**
- product_name
- product_type (Loan / Insurance / Savings / Pension)
- status (Active / Closed / Renewal Due)
- amount
- primary_person_id
- assigned_officer

Note: This represents "this product for this person", not a catalog.

#### 3.4 Interaction (most important)
**Purpose:** What actually happens on the ground.

**Fields:**
- interaction_title
- interaction_type
  - Field Visit
  - EMI Follow-up
  - Insurance Discussion
  - Claim Support
  - Financial Review
- interaction_date
- primary_person_id
- linked_product_id (optional)
- outcome
  - Completed
  - Follow-up Required
  - Customer Unavailable
  - Escalated
- next_action_date
- field_officer_notes
- assigned_officer

Note: This is where institutional memory lives.

#### 3.5 Task (optional, very light)
**Purpose:** Ensure follow-through.

**Fields:**
- task_title
- due_date
- linked_interaction_id
- assigned_officer
- status (Open / Done)

Note: You do not need a heavy task engine for the demo.

### 4. Core workflows (this is your differentiation)
These are simple, explainable, high-value workflows.

#### Workflow 1: Onboarding -> Plan
**Trigger:** New Primary Person created  
**System action:**
- Set PGPD stage = Plan
- Create first interaction task: "Initial financial assessment visit"

**Value:** Ensures every customer starts with structured engagement.

#### Workflow 2: Credit active -> Grow
**Trigger:** Product Type = Loan AND Status = Active  
**System action:**
- Suggest interaction: "Business / income review"
- Flag cross-sell potential = true

**Value:** Moves from credit delivery to income growth thinking.

#### Workflow 3: Risk flag -> Protect
**Trigger:** Risk flag added (Climate / Health / Income)  
**System action:**
- Create interaction: "Insurance discussion"
- Highlight customer in dashboard as "At Risk"

**Value:** Proactive protection instead of post-crisis response.

#### Workflow 4: Stability -> Diversify
**Trigger (manual or rule-based):** Loan completed OR stable interactions over time  
**System action:**
- Suggest interaction: "Savings / pension conversation"

**Value:** Encourages long-term wealth, not repeat debt.

#### Workflow 5: Follow-up discipline
**Trigger:** Interaction outcome = Follow-up Required  
**System action:**
- Create a task with next_action_date
- Show in officer's "Pending Follow-ups" view

**Value:** Reduces drop-offs and person-dependence.

### 5. What we deliberately did not build
To keep the system lean and buildable in 1 day, we exclude:
- Complex household hierarchies
- Aadhaar-based identity enforcement
- Accounting, collections, or underwriting logic
- Marketing campaigns
- Advanced analytics

This is intentional scope control, not a limitation.

### 6. How this adds value to Dvara (TBIT framing)
- Aligns CRM with how rural relationships actually work
- Preserves context and trust, not just transactions
- Enables PGPD-led engagement, not product pushing
- Improves continuity despite staff turnover
- Is simple enough for field adoption

## One-liner for presentation
"Instead of capturing everything, we designed a CRM that captures the right things and
converts them into timely actions aligned with Dvara's PGPD philosophy."

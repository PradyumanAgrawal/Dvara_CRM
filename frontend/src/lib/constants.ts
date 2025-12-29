export const PGPD_STAGES = ["Plan", "Grow", "Protect", "Diversify"] as const;
export const PERSON_ROLES = ["Primary Earner", "Borrower"] as const;
export const PRODUCT_TYPES = ["Loan", "Insurance", "Savings", "Pension"] as const;
export const PRODUCT_STATUSES = ["Active", "Closed", "Renewal Due"] as const;
export const INTERACTION_TYPES = [
  "Field Visit",
  "EMI Follow-up",
  "Insurance Discussion",
  "Claim Support",
  "Financial Review"
] as const;
export const INTERACTION_OUTCOMES = [
  "Completed",
  "Follow-up Required",
  "Customer Unavailable",
  "Escalated"
] as const;
export const USER_ROLES = ["Admin", "BranchManager", "FieldOfficer"] as const;
export const HOUSEHOLD_EARNING_SOURCES = ["Agriculture", "MSME", "Wage"] as const;
export const HOUSEHOLD_SEASONALITY_PROFILES = ["Kharif", "Rabi", "Perennial"] as const;
export const RISK_FLAGS = [
  "Climate Risk",
  "Income Volatility",
  "Health Shock Risk"
] as const;

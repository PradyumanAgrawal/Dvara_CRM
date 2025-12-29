import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import {
  HOUSEHOLD_EARNING_SOURCES,
  HOUSEHOLD_SEASONALITY_PROFILES,
  PERSON_ROLES,
  PGPD_STAGES,
  RISK_FLAGS
} from "@/lib/constants";
import { createPersonWithHousehold } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const fields: FieldConfig[] = [
  {
    name: "full_name",
    label: "Full name",
    type: "text",
    placeholder: "Customer name",
    required: true
  },
  {
    name: "mobile_number",
    label: "Mobile number",
    type: "text",
    placeholder: "10-digit number",
    required: true
  },
  {
    name: "village",
    label: "Village",
    type: "text",
    placeholder: "Village name",
    required: true
  },
  {
    name: "branch",
    label: "Branch",
    type: "text",
    placeholder: "Assigned branch",
    required: true
  },
  {
    name: "primary_earning_source",
    label: "Household earning source",
    type: "select",
    placeholder: "Select earning source",
    options: [
      ...HOUSEHOLD_EARNING_SOURCES.map((source) => ({ label: source, value: source }))
    ]
  },
  {
    name: "seasonality_profile",
    label: "Seasonality profile",
    type: "select",
    placeholder: "Select seasonality",
    options: [
      ...HOUSEHOLD_SEASONALITY_PROFILES.map((profile) => ({
        label: profile,
        value: profile
      }))
    ]
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Select role",
    options: [...PERSON_ROLES.map((role) => ({ label: role, value: role }))],
    required: true
  },
  {
    name: "pgpd_stage",
    label: "PGPD stage",
    type: "select",
    placeholder: "Select stage",
    options: [...PGPD_STAGES.map((stage) => ({ label: stage, value: stage }))],
    required: true
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    placeholder: "Optional context notes"
  }
];

export function PeopleCreate() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [values, setValues] = React.useState<Record<string, string>>(() => ({
    ...buildInitialValues(fields),
    pgpd_stage: "Plan"
  }));
  const [riskFlags, setRiskFlags] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.branch && !values.branch) {
      setValues((prev) => ({ ...prev, branch: profile.branch ?? "" }));
    }
  }, [profile?.branch, values.branch]);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const toggleRiskFlag = (flag: string) => {
    setRiskFlags((prev) =>
      prev.includes(flag) ? prev.filter((item) => item !== flag) : [...prev, flag]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile?.branch) {
      setError("Missing user profile or branch.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const branch = values.branch || profile.branch;
      await createPersonWithHousehold(
        {
          full_name: values.full_name,
          mobile_number: values.mobile_number,
          village: values.village,
          branch,
          role: values.role,
          pgpd_stage: values.pgpd_stage,
          assigned_officer_id: user.uid,
          risk_flags: riskFlags,
          risk_status: riskFlags.length ? "At Risk" : "Normal",
          notes: values.notes || undefined
        },
        {
          household_name: `${values.full_name} Household`,
          primary_earning_source: values.primary_earning_source || undefined,
          seasonality_profile: values.seasonality_profile || undefined,
          branch,
          assigned_officer_id: user.uid
        }
      );
      navigate("/app/people");
    } catch (submitError) {
      console.error("Failed to create person", submitError);
      setError("Failed to create person. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="New Person"
      description="Capture the primary person profile and PGPD stage."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save person"}
      cancelHref="/app/people"
    >
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name] ?? ""}
            onChange={(nextValue) => handleFieldChange(field.name, nextValue)}
          />
        ))}
        <div className="space-y-3 md:col-span-2">
          <Label>Risk flags</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {RISK_FLAGS.map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={riskFlags.includes(flag)}
                  onCheckedChange={() => toggleRiskFlag(flag)}
                />
                <span>{flag}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </FormPage>
  );
}

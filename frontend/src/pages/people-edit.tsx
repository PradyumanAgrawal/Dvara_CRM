import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

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
import {
  createTaskIfMissing,
  getHouseholdByPerson,
  getPerson,
  updatePerson,
  upsertHouseholdForPerson
} from "@/lib/firestore";
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

export function PeopleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [values, setValues] = React.useState(() => buildInitialValues(fields));
  const [riskFlags, setRiskFlags] = React.useState<string[]>([]);
  const [initialRiskFlags, setInitialRiskFlags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing person ID.");
      setLoading(false);
      return;
    }
    if (!profile?.branch) {
      setError("Missing branch information.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    Promise.all([getPerson(id), getHouseholdByPerson(profile.branch, id)])
      .then(([person, household]) => {
        if (!isMounted) return;
        if (!person) {
          setError("Person not found.");
          return;
        }
        const nextRiskFlags = Array.isArray(person.risk_flags)
          ? (person.risk_flags as string[])
          : [];
        setValues((prev) => ({
          ...prev,
          full_name: String(person.full_name ?? ""),
          mobile_number: String(person.mobile_number ?? ""),
          village: String(person.village ?? ""),
          branch: String(person.branch ?? profile.branch ?? ""),
          role: String(person.role ?? ""),
          pgpd_stage: String(person.pgpd_stage ?? ""),
          notes: String(person.notes ?? ""),
          primary_earning_source: String(household?.primary_earning_source ?? ""),
          seasonality_profile: String(household?.seasonality_profile ?? "")
        }));
        setRiskFlags(nextRiskFlags);
        setInitialRiskFlags(nextRiskFlags);
      })
      .catch((fetchError) => {
        console.error("Failed to load person", fetchError);
        if (isMounted) {
          setError("Unable to load person.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, profile?.branch]);

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
    if (!id) {
      setError("Missing person ID.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const nextRiskStatus = riskFlags.length ? "At Risk" : "Normal";
      await updatePerson(id, {
        full_name: values.full_name,
        mobile_number: values.mobile_number,
        village: values.village,
        branch: values.branch,
        role: values.role,
        pgpd_stage: values.pgpd_stage,
        notes: values.notes || undefined,
        risk_flags: riskFlags,
        risk_status: nextRiskStatus
      });
      await upsertHouseholdForPerson(values.branch, id, {
        household_name: `${values.full_name} Household`,
        primary_earning_source: values.primary_earning_source || undefined,
        seasonality_profile: values.seasonality_profile || undefined
      });
      if (user && initialRiskFlags.length === 0 && riskFlags.length > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        await createTaskIfMissing({
          task_title: "Insurance discussion",
          due_date: dueDate.toISOString().slice(0, 10),
          status: "Suggested",
          task_type: "SuggestedInteraction",
          primary_person_id: id,
          assigned_officer_id: user.uid,
          source_ref: `primary_people/${id}`,
          branch: values.branch,
          created_by: user.uid
        });
      }
      navigate(`/app/people/${id}`);
    } catch (submitError) {
      console.error("Failed to update person", submitError);
      setError("Failed to update person. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading person...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Person"
      description="Update the primary person profile and household context."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref={id ? `/app/people/${id}` : "/app/people"}
    >
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

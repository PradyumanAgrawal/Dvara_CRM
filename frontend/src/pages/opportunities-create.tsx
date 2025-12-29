import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { createRecord } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

const fields: FieldConfig[] = [
  {
    name: "opportunity_name",
    label: "Opportunity name",
    type: "text",
    placeholder: "Opportunity title",
    required: true
  },
  {
    name: "stage",
    label: "Stage",
    type: "select",
    placeholder: "Select stage",
    options: [
      { label: "Identified", value: "Identified" },
      { label: "In Review", value: "In Review" },
      { label: "Proposal", value: "Proposal" },
      { label: "Won", value: "Won" },
      { label: "Lost", value: "Lost" }
    ],
    required: true
  },
  {
    name: "value",
    label: "Value",
    type: "number",
    placeholder: "Pipeline value",
    required: true
  },
  {
    name: "owner_user_id",
    label: "Owner ID",
    type: "text",
    placeholder: "Owner user ID",
    required: true
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Optional primary person ID"
  }
];

export function OpportunitiesCreate() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [values, setValues] = React.useState(() => buildInitialValues(fields));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.branch) {
      setError("Missing branch information.");
      return;
    }

    const value = Number(values.value);
    if (!Number.isFinite(value)) {
      setError("Please enter a valid value.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await createRecord("opportunities", {
        opportunity_name: values.opportunity_name,
        stage: values.stage,
        value,
        owner_user_id: values.owner_user_id,
        primary_person_id: values.primary_person_id || undefined,
        branch: profile.branch
      });
      navigate("/app/opportunities");
    } catch (submitError) {
      console.error("Failed to create opportunity", submitError);
      setError("Failed to create opportunity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="New Opportunity"
      description="Capture pipeline opportunities with value and owner."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save opportunity"}
      cancelHref="/app/opportunities"
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
      </div>
    </FormPage>
  );
}

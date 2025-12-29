import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { getRecord, updateRecord } from "@/lib/firestore";
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
      { label: "Prospect", value: "Prospect" },
      { label: "Qualified", value: "Qualified" },
      { label: "Proposal", value: "Proposal" },
      { label: "Negotiation", value: "Negotiation" },
      { label: "Won", value: "Won" },
      { label: "Lost", value: "Lost" }
    ],
    required: true
  },
  {
    name: "value",
    label: "Pipeline value",
    type: "number",
    placeholder: "Pipeline value",
    required: true
  },
  {
    name: "owner_user_id",
    label: "Owner user ID",
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

export function OpportunitiesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [values, setValues] = React.useState<Record<string, string>>(
    () => buildInitialValues(fields)
  );
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing opportunity ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("opportunities", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Opportunity not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          opportunity_name: String(doc.opportunity_name ?? ""),
          stage: String(doc.stage ?? ""),
          value: String(doc.value ?? ""),
          owner_user_id: String(doc.owner_user_id ?? ""),
          primary_person_id: String(doc.primary_person_id ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load opportunity", fetchError);
        if (isMounted) {
          setError("Unable to load opportunity.");
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
  }, [id]);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !profile?.branch) {
      setError("Missing opportunity or branch information.");
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
      await updateRecord("opportunities", id, {
        opportunity_name: values.opportunity_name,
        stage: values.stage,
        value,
        owner_user_id: values.owner_user_id,
        primary_person_id: values.primary_person_id || undefined,
        branch: profile.branch
      });
      navigate("/app/opportunities");
    } catch (submitError) {
      console.error("Failed to update opportunity", submitError);
      setError("Failed to update opportunity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading opportunity...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Opportunity"
      description="Update pipeline stage, owner, or value."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/opportunities"
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
      </div>
    </FormPage>
  );
}

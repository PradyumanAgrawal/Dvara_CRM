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
    name: "call_time",
    label: "Call time",
    type: "date",
    required: true
  },
  {
    name: "duration",
    label: "Duration (minutes)",
    type: "number",
    placeholder: "Duration",
    required: true
  },
  {
    name: "outcome",
    label: "Outcome",
    type: "select",
    placeholder: "Select outcome",
    options: [
      { label: "Connected", value: "Connected" },
      { label: "No answer", value: "No answer" },
      { label: "Follow-up required", value: "Follow-up required" }
    ],
    required: true
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Link to primary person",
    required: true
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    placeholder: "Call notes"
  }
];

export function PhoneCallsCreate() {
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

    setError(null);
    setSubmitting(true);
    try {
      await createRecord("phone_calls", {
        call_time: values.call_time,
        duration: values.duration,
        outcome: values.outcome,
        primary_person_id: values.primary_person_id,
        notes: values.notes || undefined,
        branch: profile.branch
      });
      navigate("/app/phone-calls");
    } catch (submitError) {
      console.error("Failed to create call", submitError);
      setError("Failed to log call. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="Log Phone Call"
      description="Capture phone call outcomes and notes."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save call"}
      cancelHref="/app/phone-calls"
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

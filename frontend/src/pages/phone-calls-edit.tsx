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

export function PhoneCallsEdit() {
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
      setError("Missing phone call ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("phone_calls", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Phone call not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          call_time: String(doc.call_time ?? ""),
          duration: String(doc.duration ?? ""),
          outcome: String(doc.outcome ?? ""),
          primary_person_id: String(doc.primary_person_id ?? ""),
          notes: String(doc.notes ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load call", fetchError);
        if (isMounted) {
          setError("Unable to load phone call.");
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
      setError("Missing call or branch information.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await updateRecord("phone_calls", id, {
        call_time: values.call_time,
        duration: values.duration,
        outcome: values.outcome,
        primary_person_id: values.primary_person_id,
        notes: values.notes || undefined,
        branch: profile.branch
      });
      navigate("/app/phone-calls");
    } catch (submitError) {
      console.error("Failed to update call", submitError);
      setError("Failed to update call. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading call...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Phone Call"
      description="Update outcomes and notes."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/phone-calls"
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

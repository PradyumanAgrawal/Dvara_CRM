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
    name: "meeting_title",
    label: "Meeting title",
    type: "text",
    placeholder: "Meeting focus",
    required: true
  },
  {
    name: "scheduled_at",
    label: "Scheduled date",
    type: "date",
    required: true
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "Village or branch",
    required: true
  },
  {
    name: "attendee_ids",
    label: "Attendee IDs",
    type: "text",
    placeholder: "Comma-separated user IDs"
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    placeholder: "Meeting agenda or summary"
  }
];

export function MeetingsCreate() {
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
      const attendees = values.attendee_ids
        ? values.attendee_ids.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      await createRecord("meetings", {
        meeting_title: values.meeting_title,
        scheduled_at: values.scheduled_at,
        location: values.location,
        attendee_ids: attendees,
        notes: values.notes || undefined,
        branch: profile.branch
      });
      navigate("/app/meetings");
    } catch (submitError) {
      console.error("Failed to create meeting", submitError);
      setError("Failed to create meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="New Meeting"
      description="Schedule a meeting and capture attendees."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save meeting"}
      cancelHref="/app/meetings"
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

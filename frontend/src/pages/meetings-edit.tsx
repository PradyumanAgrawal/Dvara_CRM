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

export function MeetingsEdit() {
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
      setError("Missing meeting ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("meetings", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Meeting not found.");
          return;
        }
        const attendees = Array.isArray(doc.attendee_ids)
          ? (doc.attendee_ids as string[]).join(", ")
          : "";
        setValues((prev) => ({
          ...prev,
          meeting_title: String(doc.meeting_title ?? ""),
          scheduled_at: String(doc.scheduled_at ?? ""),
          location: String(doc.location ?? ""),
          attendee_ids: attendees,
          notes: String(doc.notes ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load meeting", fetchError);
        if (isMounted) {
          setError("Unable to load meeting.");
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
      setError("Missing meeting or branch information.");
      return;
    }

    const attendees = values.attendee_ids
      ? values.attendee_ids.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    setError(null);
    setSubmitting(true);
    try {
      await updateRecord("meetings", id, {
        meeting_title: values.meeting_title,
        scheduled_at: values.scheduled_at,
        location: values.location,
        attendee_ids: attendees,
        notes: values.notes || undefined,
        branch: profile.branch
      });
      navigate("/app/meetings");
    } catch (submitError) {
      console.error("Failed to update meeting", submitError);
      setError("Failed to update meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading meeting...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Meeting"
      description="Update schedule, location, and attendees."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/meetings"
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

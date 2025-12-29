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
    name: "task_title",
    label: "Task title",
    type: "text",
    placeholder: "Task title",
    required: true
  },
  {
    name: "due_date",
    label: "Due date",
    type: "date",
    required: true
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      { label: "Open", value: "Open" },
      { label: "Suggested", value: "Suggested" },
      { label: "Done", value: "Done" }
    ],
    required: true
  },
  {
    name: "task_type",
    label: "Task type",
    type: "text",
    placeholder: "FollowUp / SuggestedInteraction"
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Primary person ID"
  }
];

export function TasksEdit() {
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
      setError("Missing task ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("tasks", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Task not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          task_title: String(doc.task_title ?? ""),
          due_date: String(doc.due_date ?? ""),
          status: String(doc.status ?? ""),
          task_type: String(doc.task_type ?? ""),
          primary_person_id: String(doc.primary_person_id ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load task", fetchError);
        if (isMounted) {
          setError("Unable to load task.");
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
      setError("Missing task or branch information.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await updateRecord("tasks", id, {
        task_title: values.task_title,
        due_date: values.due_date,
        status: values.status,
        task_type: values.task_type || undefined,
        primary_person_id: values.primary_person_id || undefined,
        branch: profile.branch
      });
      navigate("/app/tasks");
    } catch (submitError) {
      console.error("Failed to update task", submitError);
      setError("Failed to update task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading task...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Task"
      description="Update the task status or due date."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/tasks"
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

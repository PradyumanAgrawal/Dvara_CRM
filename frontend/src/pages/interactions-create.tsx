import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { INTERACTION_OUTCOMES, INTERACTION_TYPES } from "@/lib/constants";
import { createInteraction, createTaskIfMissing } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

const fields: FieldConfig[] = [
  {
    name: "interaction_title",
    label: "Interaction title",
    type: "text",
    placeholder: "Short title",
    required: true
  },
  {
    name: "interaction_type",
    label: "Interaction type",
    type: "select",
    placeholder: "Select type",
    options: [
      ...INTERACTION_TYPES.map((type) => ({ label: type, value: type }))
    ],
    required: true
  },
  {
    name: "interaction_date",
    label: "Interaction date",
    type: "date",
    required: true
  },
  {
    name: "outcome",
    label: "Outcome",
    type: "select",
    placeholder: "Select outcome",
    options: [
      ...INTERACTION_OUTCOMES.map((outcome) => ({ label: outcome, value: outcome }))
    ],
    required: true
  },
  {
    name: "next_action_date",
    label: "Next action date",
    type: "date",
    placeholder: "Optional follow-up date"
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Link to primary person",
    required: true
  },
  {
    name: "linked_product_id",
    label: "Linked product ID",
    type: "text",
    placeholder: "Optional product ID"
  },
  {
    name: "field_officer_notes",
    label: "Field officer notes",
    type: "textarea",
    placeholder: "Notes from the visit"
  }
];

export function InteractionsCreate() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [values, setValues] = React.useState(() => buildInitialValues(fields));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
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
      const interactionRef = await createInteraction({
        interaction_title: values.interaction_title,
        interaction_type: values.interaction_type,
        interaction_date: values.interaction_date,
        outcome: values.outcome,
        next_action_date: values.next_action_date || undefined,
        primary_person_id: values.primary_person_id,
        linked_product_id: values.linked_product_id || undefined,
        field_officer_notes: values.field_officer_notes || undefined,
        branch: profile.branch,
        assigned_officer_id: user.uid
      });

      if (values.outcome === "Follow-up Required" && values.next_action_date) {
        await createTaskIfMissing({
          task_title: `Follow-up: ${values.interaction_title}`,
          due_date: values.next_action_date,
          status: "Open",
          task_type: "FollowUp",
          linked_interaction_id: interactionRef.id,
          primary_person_id: values.primary_person_id,
          assigned_officer_id: user.uid,
          source_ref: `interactions/${interactionRef.id}`,
          branch: profile.branch,
          created_by: user.uid
        });
      }

      navigate("/app/interactions");
    } catch (submitError) {
      console.error("Failed to create interaction", submitError);
      setError("Failed to create interaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="Log Interaction"
      description="Capture what happened on the ground and the next action."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save interaction"}
      cancelHref="/app/interactions"
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

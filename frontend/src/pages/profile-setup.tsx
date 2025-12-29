import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { USER_ROLES } from "@/lib/constants";
import { upsertUserProfile } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

const fields: FieldConfig[] = [
  {
    name: "display_name",
    label: "Display name",
    type: "text",
    placeholder: "Full name",
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
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Select role",
    options: USER_ROLES.map((role) => ({ label: role, value: role })),
    required: true
  }
];

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [values, setValues] = React.useState(() => buildInitialValues(fields));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.email && !values.display_name) {
      setValues((prev) => ({ ...prev, display_name: user.email ?? "" }));
    }
  }, [user?.email, values.display_name]);

  if (profile) {
    return <Navigate to="/app" replace />;
  }

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("You must be signed in to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await upsertUserProfile(user.uid, {
        display_name: values.display_name,
        branch: values.branch,
        role: values.role,
        email: user.email ?? undefined
      });
      await refreshProfile();
      navigate("/app", { replace: true });
    } catch (submitError) {
      console.error("Failed to save profile", submitError);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="Complete your profile"
      description="Set your branch and role to unlock CRM access."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save profile"}
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

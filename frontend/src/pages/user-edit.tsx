import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { USER_ROLES } from "@/lib/constants";
import { getRecord, updateRecord } from "@/lib/firestore";
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
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "name@company.com"
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

export function UserEdit() {
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
      setError("Missing user ID.");
      setLoading(false);
      return;
    }
    if (profile?.role !== "Admin") {
      setError("Admin access required.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("users", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("User not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          display_name: String(doc.display_name ?? ""),
          email: String(doc.email ?? ""),
          branch: String(doc.branch ?? ""),
          role: String(doc.role ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load user", fetchError);
        if (isMounted) {
          setError("Unable to load user.");
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
  }, [id, profile?.role]);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      setError("Missing user ID.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await updateRecord("users", id, {
        display_name: values.display_name,
        email: values.email || undefined,
        branch: values.branch,
        role: values.role
      });
      navigate("/app/settings/users");
    } catch (submitError) {
      console.error("Failed to update user", submitError);
      setError("Failed to update user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading user...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit User"
      description="Update role and branch assignment."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/settings/users"
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

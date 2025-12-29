import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/lib/constants";
import { createProduct, createTaskIfMissing } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

const fields: FieldConfig[] = [
  {
    name: "product_name",
    label: "Product name",
    type: "text",
    placeholder: "Loan / Insurance product",
    required: true
  },
  {
    name: "product_type",
    label: "Product type",
    type: "select",
    placeholder: "Select type",
    options: [
      ...PRODUCT_TYPES.map((type) => ({ label: type, value: type }))
    ],
    required: true
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      ...PRODUCT_STATUSES.map((status) => ({ label: status, value: status }))
    ],
    required: true
  },
  {
    name: "amount",
    label: "Amount",
    type: "number",
    placeholder: "Enter amount",
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
    name: "assigned_officer_id",
    label: "Assigned officer ID",
    type: "text",
    placeholder: "Officer UID",
    required: true
  }
];

export function ProductsCreate() {
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

    const amount = Number(values.amount);
    if (!Number.isFinite(amount)) {
      setError("Please enter a valid amount.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const productRef = await createProduct({
        product_name: values.product_name,
        product_type: values.product_type,
        status: values.status,
        amount,
        primary_person_id: values.primary_person_id,
        assigned_officer_id: values.assigned_officer_id || user.uid,
        branch: profile.branch
      });
      if (values.product_type === "Loan" && values.status === "Active") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        await createTaskIfMissing({
          task_title: "Business / income review",
          due_date: dueDate.toISOString().slice(0, 10),
          status: "Suggested",
          task_type: "SuggestedInteraction",
          primary_person_id: values.primary_person_id,
          assigned_officer_id: values.assigned_officer_id || user.uid,
          source_ref: `products/${productRef.id}`,
          branch: profile.branch,
          created_by: user.uid
        });
      }
      navigate("/app/products");
    } catch (submitError) {
      console.error("Failed to create product", submitError);
      setError("Failed to create product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="New Product"
      description="Register a new financial relationship for a person."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save product"}
      cancelHref="/app/products"
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

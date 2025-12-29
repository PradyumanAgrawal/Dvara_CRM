import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/lib/constants";
import { createTaskIfMissing, getProduct, updateRecord } from "@/lib/firestore";
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
    options: [...PRODUCT_TYPES.map((type) => ({ label: type, value: type }))],
    required: true
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [...PRODUCT_STATUSES.map((status) => ({ label: status, value: status }))],
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
    placeholder: "Officer UID"
  }
];

export function ProductsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [values, setValues] = React.useState<Record<string, string>>(
    () => buildInitialValues(fields)
  );
  const [initialProduct, setInitialProduct] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing product ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Product not found.");
          return;
        }
        setInitialProduct(doc);
        setValues((prev) => ({
          ...prev,
          product_name: String(doc.product_name ?? ""),
          product_type: String(doc.product_type ?? ""),
          status: String(doc.status ?? ""),
          amount: String(doc.amount ?? ""),
          primary_person_id: String(doc.primary_person_id ?? ""),
          assigned_officer_id: String(doc.assigned_officer_id ?? "")
        }));
      })
      .catch((fetchError) => {
        console.error("Failed to load product", fetchError);
        if (isMounted) {
          setError("Unable to load product.");
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
      setError("Missing product or branch information.");
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
      await updateRecord("products", id, {
        product_name: values.product_name,
        product_type: values.product_type,
        status: values.status,
        amount,
        primary_person_id: values.primary_person_id,
        assigned_officer_id: values.assigned_officer_id || user?.uid,
        branch: profile.branch
      });

      const wasLoanActive =
        initialProduct.product_type === "Loan" && initialProduct.status === "Active";
      const isLoanActive =
        values.product_type === "Loan" && values.status === "Active";
      if (user && isLoanActive && !wasLoanActive) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        await createTaskIfMissing({
          task_title: "Business / income review",
          due_date: dueDate.toISOString().slice(0, 10),
          status: "Suggested",
          task_type: "SuggestedInteraction",
          primary_person_id: values.primary_person_id,
          assigned_officer_id: values.assigned_officer_id || user.uid,
          source_ref: `products/${id}`,
          branch: profile.branch,
          created_by: user.uid
        });
      }

      if (user && values.status === "Closed" && initialProduct.status !== "Closed") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        await createTaskIfMissing({
          task_title: "Savings / pension conversation",
          due_date: dueDate.toISOString().slice(0, 10),
          status: "Suggested",
          task_type: "SuggestedInteraction",
          primary_person_id: values.primary_person_id,
          assigned_officer_id: values.assigned_officer_id || user.uid,
          source_ref: `products/${id}`,
          branch: profile.branch,
          created_by: user.uid
        });
      }

      navigate(`/app/products/${id}`);
    } catch (submitError) {
      console.error("Failed to update product", submitError);
      setError("Failed to update product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading product...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Product"
      description="Update product status, amounts, and owner details."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref={id ? `/app/products/${id}` : "/app/products"}
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

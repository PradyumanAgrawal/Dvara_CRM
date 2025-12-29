import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { Dropzone } from "@/components/kibo/dropzone";
import { FormPage } from "@/components/templates/form-page";
import { getRecord, updateRecord } from "@/lib/firestore";
import { uploadAttachment } from "@/lib/storage";
import { useAuth } from "@/providers/auth-provider";

const fields: FieldConfig[] = [
  {
    name: "invoice_title",
    label: "Invoice title",
    type: "text",
    placeholder: "Invoice name",
    required: true
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      { label: "Draft", value: "Draft" },
      { label: "Sent", value: "Sent" },
      { label: "Paid", value: "Paid" },
      { label: "Overdue", value: "Overdue" }
    ],
    required: true
  },
  {
    name: "amount",
    label: "Amount",
    type: "number",
    placeholder: "Invoice amount",
    required: true
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Optional person ID"
  }
];

export function InvoicesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [values, setValues] = React.useState<Record<string, string>>(
    () => buildInitialValues(fields)
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [existingAttachment, setExistingAttachment] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing invoice ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("invoices", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Invoice not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          invoice_title: String(doc.invoice_title ?? ""),
          status: String(doc.status ?? ""),
          amount: String(doc.amount ?? ""),
          primary_person_id: String(doc.primary_person_id ?? "")
        }));
        setExistingAttachment(String(doc.attachment_name ?? ""));
      })
      .catch((fetchError) => {
        console.error("Failed to load invoice", fetchError);
        if (isMounted) {
          setError("Unable to load invoice.");
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

  const handleFileSelect = (nextFile: File | null) => {
    setFile(nextFile);
    setFileName(nextFile?.name ?? "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !profile?.branch) {
      setError("Missing invoice or branch information.");
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
      await updateRecord("invoices", id, {
        invoice_title: values.invoice_title,
        status: values.status,
        amount,
        primary_person_id: values.primary_person_id || undefined,
        branch: profile.branch
      });

      if (file) {
        const uploaded = await uploadAttachment(`invoices/${id}/${file.name}`, file);
        await updateRecord("invoices", id, {
          attachment_name: uploaded.name,
          attachment_path: uploaded.path,
          attachment_url: uploaded.url
        });
      }

      navigate("/app/invoices");
    } catch (submitError) {
      console.error("Failed to update invoice", submitError);
      setError("Failed to update invoice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading invoice...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit Invoice"
      description="Update invoice status, amount, or attachments."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/invoices"
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
        <div className="space-y-2 md:col-span-2">
          <Dropzone
            label="Replace invoice attachment"
            description="Upload the invoice PDF"
            accept=".pdf"
            onFileSelect={handleFileSelect}
          />
          {fileName || existingAttachment ? (
            <p className="text-xs text-muted-foreground">
              Current: {fileName || existingAttachment}
            </p>
          ) : null}
        </div>
      </div>
    </FormPage>
  );
}

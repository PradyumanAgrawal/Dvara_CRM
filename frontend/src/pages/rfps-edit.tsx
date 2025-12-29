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
    name: "rfp_title",
    label: "RFP title",
    type: "text",
    placeholder: "RFP name",
    required: true
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      { label: "Draft", value: "Draft" },
      { label: "Submitted", value: "Submitted" },
      { label: "Won", value: "Won" },
      { label: "Lost", value: "Lost" }
    ],
    required: true
  },
  {
    name: "due_date",
    label: "Due date",
    type: "date",
    required: true
  },
  {
    name: "primary_person_id",
    label: "Primary person ID",
    type: "text",
    placeholder: "Optional person ID"
  }
];

export function RfpsEdit() {
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
      setError("Missing RFP ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getRecord("rfps", id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("RFP not found.");
          return;
        }
        setValues((prev) => ({
          ...prev,
          rfp_title: String(doc.rfp_title ?? ""),
          status: String(doc.status ?? ""),
          due_date: String(doc.due_date ?? ""),
          primary_person_id: String(doc.primary_person_id ?? "")
        }));
        setExistingAttachment(String(doc.attachment_name ?? ""));
      })
      .catch((fetchError) => {
        console.error("Failed to load RFP", fetchError);
        if (isMounted) {
          setError("Unable to load RFP.");
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
      setError("Missing RFP or branch information.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await updateRecord("rfps", id, {
        rfp_title: values.rfp_title,
        status: values.status,
        due_date: values.due_date,
        primary_person_id: values.primary_person_id || undefined,
        branch: profile.branch
      });

      if (file) {
        const uploaded = await uploadAttachment(`rfps/${id}/${file.name}`, file);
        await updateRecord("rfps", id, {
          attachment_name: uploaded.name,
          attachment_path: uploaded.path,
          attachment_url: uploaded.url
        });
      }

      navigate("/app/rfps");
    } catch (submitError) {
      console.error("Failed to update RFP", submitError);
      setError("Failed to update RFP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading RFP...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <FormPage
      title="Edit RFP"
      description="Update RFP status and replace attachments."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save changes"}
      cancelHref="/app/rfps"
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
            label="Replace RFP attachment"
            description="PDFs or docs up to 10MB"
            accept=".pdf,.doc,.docx"
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

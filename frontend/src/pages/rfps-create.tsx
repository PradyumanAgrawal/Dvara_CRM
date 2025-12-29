import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  buildInitialValues,
  FieldRenderer,
  type FieldConfig
} from "@/components/fields/field-registry";
import { FormPage } from "@/components/templates/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecord } from "@/lib/firestore";
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

export function RfpsCreate() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [values, setValues] = React.useState(() => buildInitialValues(fields));
  const [fileName, setFileName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFieldChange = (name: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
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
      await createRecord("rfps", {
        rfp_title: values.rfp_title,
        status: values.status,
        due_date: values.due_date,
        primary_person_id: values.primary_person_id || undefined,
        attachment_name: fileName || undefined,
        branch: profile.branch
      });
      navigate("/app/rfps");
    } catch (submitError) {
      console.error("Failed to create RFP", submitError);
      setError("Failed to create RFP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="New RFP"
      description="Track proposal requests and attachments."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving..." : "Save RFP"}
      cancelHref="/app/rfps"
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
        <div className="space-y-2">
          <Label htmlFor="rfp_attachment">Attachment</Label>
          <Input id="rfp_attachment" type="file" onChange={handleFileChange} />
          {fileName ? (
            <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
          ) : null}
        </div>
      </div>
    </FormPage>
  );
}

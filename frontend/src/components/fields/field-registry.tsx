import * as React from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "date";
  placeholder?: string;
  options?: FieldOption[];
  required?: boolean;
  description?: string;
};

type FieldRendererProps = {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
};

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const id = field.name;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        />
      ) : field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Select"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={field.type}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        />
      )}
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
    </div>
  );
}

export function buildInitialValues(fields: FieldConfig[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});
}

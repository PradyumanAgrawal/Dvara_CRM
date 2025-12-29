import * as React from "react";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";

type DropzoneProps = {
  label?: string;
  description?: string;
  accept?: string;
  onFileSelect: (file: File | null) => void;
  className?: string;
};

export function Dropzone({
  label = "Upload file",
  description = "Drag and drop or click to browse",
  accept,
  onFileSelect,
  className
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    onFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition hover:border-foreground/40",
        isDragging && "border-foreground/60 bg-muted/40",
        className
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <UploadCloud className="h-5 w-5 text-muted-foreground" />
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={accept}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}

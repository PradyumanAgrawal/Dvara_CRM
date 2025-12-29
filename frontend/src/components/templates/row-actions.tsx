import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type RowActionsProps = {
  editHref?: string;
  onDelete?: () => void | Promise<void>;
  confirmMessage?: string;
  deleteLabel?: string;
};

export function RowActions({
  editHref,
  onDelete,
  confirmMessage = "Delete this record?",
  deleteLabel = "Delete"
}: RowActionsProps) {
  const handleDelete = () => {
    if (!onDelete) return;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
    onDelete();
  };

  return (
    <div className="flex items-center gap-2">
      {editHref ? (
        <Button asChild variant="link" size="sm">
          <Link to={editHref}>Edit</Link>
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={handleDelete}
        >
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}

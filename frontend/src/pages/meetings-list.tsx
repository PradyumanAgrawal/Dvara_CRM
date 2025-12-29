import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { RowActions } from "@/components/templates/row-actions";
import { deleteRecord, listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type MeetingRow = {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: string;
};

export function MeetingsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<MeetingRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!profile?.branch) {
      setLoading(false);
      setError("Missing branch information.");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    listRecords("meetings", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          title: String(doc.meeting_title ?? "Meeting"),
          date: String(doc.scheduled_at ?? "-"),
          location: String(doc.location ?? "-"),
          attendees: String((doc.attendee_ids ?? []).length ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load meetings", err);
        if (isMounted) {
          setError("Unable to load meetings right now.");
          setRows([]);
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
  }, [profile?.branch]);

  const filteredRows = rows.filter((row) => {
    const target = [row.title, row.location].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("meetings", id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete meeting", err);
      setError("Failed to delete meeting.");
    }
  };

  const columns: ColumnDef<MeetingRow>[] = [
    {
      header: "Meeting",
      cell: (row) => row.title
    },
    {
      header: "Date",
      cell: (row) => <Badge variant="secondary">{row.date}</Badge>
    },
    {
      header: "Location",
      cell: (row) => row.location
    },
    {
      header: "Attendees",
      cell: (row) => row.attendees
    },
    {
      header: "Action",
      cell: (row) => (
        <RowActions
          editHref={`/app/meetings/${row.id}/edit`}
          onDelete={() => handleDelete(row.id)}
          confirmMessage="Delete this meeting?"
        />
      )
    }
  ];

  return (
    <ListPage
      title="Meetings"
      description="Schedule and track meetings and touchpoints."
      actionLabel="New Meeting"
      onAction={() => navigate("/app/meetings/new")}
      searchPlaceholder="Search meetings"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load meetings" : "No meetings yet"}
      emptyDescription={error ?? "Schedule a meeting to get started."}
    />
  );
}

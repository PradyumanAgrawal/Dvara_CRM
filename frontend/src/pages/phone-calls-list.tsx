import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { RowActions } from "@/components/templates/row-actions";
import { deleteRecord, listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type CallRow = {
  id: string;
  time: string;
  duration: string;
  outcome: string;
  person: string;
};

export function PhoneCallsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<CallRow[]>([]);
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
    listRecords("phone_calls", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          time: String(doc.call_time ?? "-"),
          duration: String(doc.duration ?? "-"),
          outcome: String(doc.outcome ?? "-"),
          person: String(doc.primary_person_id ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load phone calls", err);
        if (isMounted) {
          setError("Unable to load phone calls right now.");
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
    const target = [row.outcome, row.person].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("phone_calls", id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete phone call", err);
      setError("Failed to delete phone call.");
    }
  };

  const columns: ColumnDef<CallRow>[] = [
    {
      header: "Call time",
      cell: (row) => row.time
    },
    {
      header: "Duration",
      cell: (row) => row.duration
    },
    {
      header: "Outcome",
      cell: (row) => <Badge variant="secondary">{row.outcome}</Badge>
    },
    {
      header: "Primary person",
      cell: (row) => row.person
    },
    {
      header: "Action",
      cell: (row) => (
        <RowActions
          editHref={`/app/phone-calls/${row.id}/edit`}
          onDelete={() => handleDelete(row.id)}
          confirmMessage="Delete this phone call?"
        />
      )
    }
  ];

  return (
    <ListPage
      title="Phone Calls"
      description="Log call outcomes and customer touchpoints."
      actionLabel="Log Call"
      onAction={() => navigate("/app/phone-calls/new")}
      searchPlaceholder="Search phone calls"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load phone calls" : "No calls yet"}
      emptyDescription={error ?? "Log your first call."}
    />
  );
}

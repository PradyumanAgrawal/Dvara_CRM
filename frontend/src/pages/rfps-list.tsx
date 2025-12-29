import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type RfpRow = {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  attachment: string;
};

const columns: ColumnDef<RfpRow>[] = [
  {
    header: "RFP",
    cell: (row) => row.title
  },
  {
    header: "Status",
    cell: (row) => <Badge variant="secondary">{row.status}</Badge>
  },
  {
    header: "Due date",
    cell: (row) => row.dueDate
  },
  {
    header: "Attachment",
    cell: (row) => row.attachment
  }
];

export function RfpsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<RfpRow[]>([]);
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
    listRecords("rfps", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          title: String(doc.rfp_title ?? "RFP"),
          status: String(doc.status ?? "-"),
          dueDate: String(doc.due_date ?? "-"),
          attachment: String(doc.attachment_name ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load RFPs", err);
        if (isMounted) {
          setError("Unable to load RFPs right now.");
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
    const target = [row.title, row.status].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="RFPs"
      description="Track proposal requests and deadlines."
      actionLabel="New RFP"
      onAction={() => navigate("/app/rfps/new")}
      searchPlaceholder="Search RFPs"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load RFPs" : "No RFPs yet"}
      emptyDescription={error ?? "Create the first RFP."}
    />
  );
}

import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { formatCurrency } from "@/lib/formatters";
import { listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type OpportunityRow = {
  id: string;
  name: string;
  stage: string;
  value: string;
  owner: string;
  person: string;
};

const columns: ColumnDef<OpportunityRow>[] = [
  {
    header: "Opportunity",
    cell: (row) => row.name
  },
  {
    header: "Stage",
    cell: (row) => <Badge variant="secondary">{row.stage}</Badge>
  },
  {
    header: "Value",
    cell: (row) => row.value
  },
  {
    header: "Owner",
    cell: (row) => row.owner
  },
  {
    header: "Primary person",
    cell: (row) => row.person
  }
];

export function OpportunitiesList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<OpportunityRow[]>([]);
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
    listRecords("opportunities", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          name: String(doc.opportunity_name ?? "Opportunity"),
          stage: String(doc.stage ?? "-"),
          value: formatCurrency(Number(doc.value ?? 0)),
          owner: String(doc.owner_user_id ?? "-") ,
          person: String(doc.primary_person_id ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load opportunities", err);
        if (isMounted) {
          setError("Unable to load opportunities right now.");
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
    const target = [row.name, row.stage, row.owner, row.person].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="Opportunities"
      description="Track pipeline value and active deals."
      actionLabel="New Opportunity"
      onAction={() => navigate("/app/opportunities/new")}
      searchPlaceholder="Search opportunities"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load opportunities" : "No opportunities yet"}
      emptyDescription={error ?? "Create the first opportunity to start tracking pipeline."}
    />
  );
}

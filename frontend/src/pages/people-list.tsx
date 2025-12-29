import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { listPeople } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type PersonRow = {
  id: string;
  fullName: string;
  village: string;
  pgpdStage: string;
  riskStatus: "At Risk" | "Normal";
};

const columns: ColumnDef<PersonRow>[] = [
  {
    header: "Name",
    cell: (row) => (
      <Link className="font-medium text-primary hover:underline" to={`/app/people/${row.id}`}>
        {row.fullName}
      </Link>
    )
  },
  {
    header: "Village",
    cell: (row) => row.village
  },
  {
    header: "PGPD Stage",
    cell: (row) => <Badge variant="secondary">{row.pgpdStage}</Badge>
  },
  {
    header: "Risk",
    cell: (row) => (
      <Badge variant={row.riskStatus === "At Risk" ? "destructive" : "secondary"}>
        {row.riskStatus}
      </Badge>
    )
  }
];

export function PeopleList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<PersonRow[]>([]);
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
    listPeople(profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped: PersonRow[] = data.map((doc) => ({
          id: String(doc.id),
          fullName: String(doc.full_name ?? "Unknown"),
          village: String(doc.village ?? "-"),
          pgpdStage: String(doc.pgpd_stage ?? "Plan"),
          riskStatus: (doc.risk_status === "At Risk" ? "At Risk" : "Normal") as PersonRow["riskStatus"]
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load people", err);
        if (isMounted) {
          setError("Unable to load people right now.");
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
    const target = [row.fullName, row.village, row.pgpdStage, row.riskStatus]
      .join(" ")
      .toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="People"
      description="Primary people profiles across the branch."
      actionLabel="New Person"
      onAction={() => navigate("/app/people/new")}
      searchPlaceholder="Search people"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load people" : "No people yet"}
      emptyDescription={
        error ?? "Create your first person profile to get started."
      }
    />
  );
}

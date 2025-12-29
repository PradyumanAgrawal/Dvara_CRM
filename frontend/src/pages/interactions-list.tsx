import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import type { TableFilter } from "@/components/templates/data-table";
import { INTERACTION_OUTCOMES } from "@/lib/constants";
import { listInteractions } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type InteractionRow = {
  id: string;
  title: string;
  type: string;
  date: string;
  outcome: string;
  personId: string;
  personName: string;
  officerId: string;
};

const columns: ColumnDef<InteractionRow>[] = [
  {
    header: "Interaction",
    cell: (row) => row.title
  },
  {
    header: "Type",
    cell: (row) => <Badge variant="secondary">{row.type}</Badge>
  },
  {
    header: "Date",
    cell: (row) => row.date
  },
  {
    header: "Outcome",
    cell: (row) => <Badge variant="secondary">{row.outcome}</Badge>
  },
  {
    header: "Person",
    cell: (row) => (
      <Link className="text-primary hover:underline" to={`/app/people/${row.personId}`}>
        {row.personName}
      </Link>
    )
  },
  {
    header: "Action",
    cell: (row) => (
      <Link className="text-primary hover:underline" to={`/app/interactions/${row.id}/edit`}>
        Edit
      </Link>
    )
  }
];

export function InteractionsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<InteractionRow[]>([]);
  const [filtersState, setFiltersState] = React.useState<Record<string, string>>({
    outcome: "all",
    officer: "all"
  });
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
    listInteractions(profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          title: String(doc.interaction_title ?? "Interaction"),
          type: String(doc.interaction_type ?? "-"),
          date: String(doc.interaction_date ?? "-"),
          outcome: String(doc.outcome ?? "-"),
          personId: String(doc.primary_person_id ?? ""),
          personName: String(doc.primary_person_name ?? doc.primary_person_id ?? "Unknown"),
          officerId: String(doc.assigned_officer_id ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load interactions", err);
        if (isMounted) {
          setError("Unable to load interactions right now.");
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

  const officerOptions = React.useMemo(() => {
    const uniqueIds = Array.from(new Set(rows.map((row) => row.officerId).filter(Boolean)));
    return [
      { label: "All", value: "all" },
      ...uniqueIds.map((id) => ({ label: id, value: id }))
    ];
  }, [rows]);

  const filters: TableFilter[] = [
    {
      name: "outcome",
      label: "Outcome",
      placeholder: "Filter outcome",
      options: [
        { label: "All", value: "all" },
        ...INTERACTION_OUTCOMES.map((outcome) => ({ label: outcome, value: outcome }))
      ]
    },
    {
      name: "officer",
      label: "Officer",
      placeholder: "Filter officer",
      options: officerOptions
    }
  ];

  const filteredRows = rows.filter((row) => {
    const outcomeMatch =
      filtersState.outcome === "all" || row.outcome === filtersState.outcome;
    const officerMatch =
      filtersState.officer === "all" || row.officerId === filtersState.officer;
    return outcomeMatch && officerMatch;
  });

  const searchFilteredRows = filteredRows.filter((row) => {
    const target = [row.title, row.type, row.outcome, row.personName, row.officerId]
      .join(" ")
      .toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="Interactions"
      description="Track field visits, follow-ups, and outcome notes."
      actionLabel="Log Interaction"
      onAction={() => navigate("/app/interactions/new")}
      searchPlaceholder="Search interactions"
      searchValue={search}
      onSearchChange={setSearch}
      filters={filters}
      filterValues={filtersState}
      onFilterChange={(name, value) => setFiltersState((prev) => ({ ...prev, [name]: value }))}
      columns={columns}
      data={searchFilteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load interactions" : "No interactions yet"}
      emptyDescription={error ?? "Log the first interaction."}
    />
  );
}

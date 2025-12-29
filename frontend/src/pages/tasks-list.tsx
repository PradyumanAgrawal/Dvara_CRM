import * as React from "react";

import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import type { TableFilter } from "@/components/templates/data-table";
import { listTasksByOfficer, updateTask } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type TaskRow = {
  id: string;
  title: string;
  dueDate: string;
  status: "Open" | "Done" | "Suggested";
  person: string;
};

const filters: TableFilter[] = [
  {
    name: "status",
    label: "Status",
    placeholder: "Filter by status",
    options: [
      { label: "All", value: "all" },
      { label: "Open", value: "Open" },
      { label: "Suggested", value: "Suggested" },
      { label: "Done", value: "Done" }
    ]
  }
];

export function TasksList() {
  const { user } = useAuth();
  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [filtersState, setFiltersState] = React.useState<Record<string, string>>({
    status: "all"
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Missing user session.");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    listTasksByOfficer(user.uid)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          title: String(doc.task_title ?? "Task"),
          dueDate: String(doc.due_date ?? "-"),
          status: (doc.status ?? "Open") as TaskRow["status"],
          person: String(doc.primary_person_name ?? doc.primary_person_id ?? "Unknown")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load tasks", err);
        if (isMounted) {
          setError("Unable to load tasks.");
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
  }, [user]);

  const handleStatusChange = async (id: string, status: TaskRow["status"]) => {
    try {
      await updateTask(id, { status });
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row))
      );
    } catch (err) {
      console.error("Failed to update task", err);
      setError("Failed to update task status.");
    }
  };

  const filteredRows = rows.filter((row) => {
    if (filtersState.status === "all") {
      return true;
    }
    return row.status === filtersState.status;
  });

  const searchFilteredRows = filteredRows.filter((row) => {
    const target = [row.title, row.person].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const columns: ColumnDef<TaskRow>[] = [
    {
      header: "Task",
      cell: (row) => row.title
    },
    {
      header: "Person",
      cell: (row) => row.person
    },
    {
      header: "Due date",
      cell: (row) => row.dueDate
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "Done" ? "secondary" : "outline"}>
          {row.status}
        </Badge>
      )
    },
    {
      header: "Action",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.status === "Done" ? "secondary" : "default"}
          onClick={() =>
            handleStatusChange(row.id, row.status === "Done" ? "Open" : "Done")
          }
        >
          {row.status === "Done" ? "Reopen" : "Mark done"}
        </Button>
      )
    }
  ];

  const queue = rows.filter((row) => row.status !== "Done");

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <ListPage
        title="Tasks"
        description="Follow-up discipline and suggested actions."
        searchPlaceholder="Search tasks"
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={searchFilteredRows}
        filters={filters}
        filterValues={filtersState}
        onFilterChange={(name, value) => setFiltersState((prev) => ({ ...prev, [name]: value }))}
        emptyTitle={loading ? "Loading..." : error ? "Unable to load tasks" : "No tasks yet"}
        emptyDescription={error ?? "Follow-ups will appear here."}
      />

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Next up</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading tasks...</div>
          ) : queue.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pending tasks.</div>
          ) : (
            <AnimatedList className="items-start">
              {queue.map((row) => (
                <AnimatedListItem key={row.id}>
                  <div className="flex w-full flex-col gap-1 rounded-lg border bg-background px-3 py-2">
                    <div className="text-sm font-semibold">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{row.person}</div>
                    <Badge variant="secondary" className="w-fit">
                      Due {row.dueDate}
                    </Badge>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

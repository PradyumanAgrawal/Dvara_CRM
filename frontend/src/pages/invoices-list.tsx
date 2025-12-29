import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { formatCurrency } from "@/lib/formatters";
import { listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type InvoiceRow = {
  id: string;
  title: string;
  status: string;
  amount: string;
  person: string;
};

const columns: ColumnDef<InvoiceRow>[] = [
  {
    header: "Invoice",
    cell: (row) => row.title
  },
  {
    header: "Status",
    cell: (row) => <Badge variant="secondary">{row.status}</Badge>
  },
  {
    header: "Amount",
    cell: (row) => row.amount
  },
  {
    header: "Primary person",
    cell: (row) => row.person
  }
];

export function InvoicesList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<InvoiceRow[]>([]);
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
    listRecords("invoices", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          title: String(doc.invoice_title ?? "Invoice"),
          status: String(doc.status ?? "-"),
          amount: formatCurrency(Number(doc.amount ?? 0)),
          person: String(doc.primary_person_id ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load invoices", err);
        if (isMounted) {
          setError("Unable to load invoices right now.");
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
    const target = [row.title, row.status, row.person].join(" ").toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="Invoices"
      description="Generate and track invoice status."
      actionLabel="New Invoice"
      onAction={() => navigate("/app/invoices/new")}
      searchPlaceholder="Search invoices"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load invoices" : "No invoices yet"}
      emptyDescription={error ?? "Create the first invoice."}
    />
  );
}

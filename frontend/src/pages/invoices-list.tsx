import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { RowActions } from "@/components/templates/row-actions";
import { formatCurrency } from "@/lib/formatters";
import { deleteRecord, listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type InvoiceRow = {
  id: string;
  title: string;
  status: string;
  amount: string;
  person: string;
  attachment: string;
  attachmentUrl?: string;
};

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
          person: String(doc.primary_person_id ?? "-"),
          attachment: String(doc.attachment_name ?? "-"),
          attachmentUrl: doc.attachment_url ? String(doc.attachment_url) : undefined
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

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("invoices", id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete invoice", err);
      setError("Failed to delete invoice.");
    }
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
    },
    {
      header: "Attachment",
      cell: (row) =>
        row.attachmentUrl ? (
          <a
            className="text-primary hover:underline"
            href={row.attachmentUrl}
            target="_blank"
            rel="noreferrer"
          >
            {row.attachment}
          </a>
        ) : (
          row.attachment
        )
    },
    {
      header: "Action",
      cell: (row) => (
        <RowActions
          editHref={`/app/invoices/${row.id}/edit`}
          onDelete={() => handleDelete(row.id)}
          confirmMessage="Delete this invoice?"
        />
      )
    }
  ];

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

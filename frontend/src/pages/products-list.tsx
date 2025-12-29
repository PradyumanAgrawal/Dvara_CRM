import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ListPage, type ColumnDef } from "@/components/templates/list-page";
import { formatCurrency } from "@/lib/formatters";
import { listProducts } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type ProductRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  amount: string;
  personId: string;
  personName: string;
};

const columns: ColumnDef<ProductRow>[] = [
  {
    header: "Product",
    cell: (row) => (
      <Link className="font-medium text-primary hover:underline" to={`/app/products/${row.id}`}>
        {row.name}
      </Link>
    )
  },
  {
    header: "Type",
    cell: (row) => <Badge variant="secondary">{row.type}</Badge>
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
    cell: (row) => (
      <Link className="text-primary hover:underline" to={`/app/people/${row.personId}`}>
        {row.personName}
      </Link>
    )
  },
  {
    header: "Action",
    cell: (row) => (
      <Link className="text-primary hover:underline" to={`/app/products/${row.id}/edit`}>
        Edit
      </Link>
    )
  }
];

export function ProductsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<ProductRow[]>([]);
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
    listProducts(profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          name: String(doc.product_name ?? "Product"),
          type: String(doc.product_type ?? "-"),
          status: String(doc.status ?? "-"),
          amount: formatCurrency(Number(doc.amount ?? 0)),
          personId: String(doc.primary_person_id ?? ""),
          personName: String(doc.primary_person_name ?? doc.primary_person_id ?? "Unknown")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (isMounted) {
          setError("Unable to load products right now.");
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
    const target = [row.name, row.type, row.status, row.personName]
      .join(" ")
      .toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <ListPage
      title="Products"
      description="Track the financial relationships for each primary person."
      actionLabel="New Product"
      onAction={() => navigate("/app/products/new")}
      searchPlaceholder="Search products"
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      data={filteredRows}
      emptyTitle={loading ? "Loading..." : error ? "Unable to load products" : "No products yet"}
      emptyDescription={error ?? "Add the first product relationship."}
    />
  );
}

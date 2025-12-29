import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPage } from "@/components/templates/detail-page";
import { formatCurrency } from "@/lib/formatters";
import { getProduct } from "@/lib/firestore";

export function ProductsDetail() {
  const { id } = useParams();
  const [product, setProduct] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing product ID.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((doc) => {
        if (!isMounted) return;
        setProduct(doc);
      })
      .catch((err) => {
        console.error("Failed to load product", err);
        if (isMounted) {
          setError("Unable to load product.");
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
  }, [id]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="text-sm text-muted-foreground">
        {error ?? "Product not found."}
      </div>
    );
  }

  const meta = [
    {
      label: "Type",
      value: <Badge variant="secondary">{String(product.product_type ?? "-")}</Badge>
    },
    {
      label: "Status",
      value: <Badge variant="secondary">{String(product.status ?? "-")}</Badge>
    },
    {
      label: "Amount",
      value: formatCurrency(Number(product.amount ?? 0))
    },
    {
      label: "Primary person",
      value: String(product.primary_person_id ?? "-")
    }
  ];

  return (
    <DetailPage
      title={String(product.product_name ?? "Product")}
      description="Product relationship"
      meta={meta}
      actions={
        id ? (
          <Button asChild variant="outline">
            <Link to={`/app/products/${id}/edit`}>Edit product</Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interaction history</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No interactions logged yet.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next action</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Schedule a business / income review.
          </CardContent>
        </Card>
      </div>
    </DetailPage>
  );
}

import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPage } from "@/components/templates/detail-page";
import { formatCurrency } from "@/lib/formatters";
import {
  getHouseholdByPerson,
  getPerson,
  listInteractionsByPerson,
  listProductsByPerson,
  listTasksByPerson
} from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

export function PeopleDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [person, setPerson] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [relatedLoading, setRelatedLoading] = React.useState(true);
  const [relatedError, setRelatedError] = React.useState<string | null>(null);
  const [interactions, setInteractions] = React.useState<Record<string, unknown>[]>([]);
  const [products, setProducts] = React.useState<Record<string, unknown>[]>([]);
  const [tasks, setTasks] = React.useState<Record<string, unknown>[]>([]);
  const [household, setHousehold] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Missing person ID.");
      setLoading(false);
      return;
    }
    if (!profile?.branch) {
      setError("Missing branch information.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getPerson(id)
      .then((doc) => {
        if (!isMounted) return;
        setPerson(doc);
      })
      .catch((err) => {
        console.error("Failed to load person", err);
        if (isMounted) {
          setError("Unable to load person.");
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
  }, [id, profile?.branch]);

  React.useEffect(() => {
    if (!id || !profile?.branch) {
      setRelatedLoading(false);
      return;
    }

    let isMounted = true;
    setRelatedLoading(true);
    setRelatedError(null);

    Promise.all([
      listInteractionsByPerson(profile.branch, id),
      listProductsByPerson(profile.branch, id),
      listTasksByPerson(profile.branch, id),
      getHouseholdByPerson(profile.branch, id)
    ])
      .then(([interactionData, productData, taskData, householdData]) => {
        if (!isMounted) return;
        setInteractions(interactionData);
        setProducts(productData);
        setTasks(taskData);
        setHousehold(householdData);
      })
      .catch((err) => {
        console.error("Failed to load related data", err);
        if (isMounted) {
          setRelatedError("Unable to load related data.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setRelatedLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, profile?.branch]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading person...</div>;
  }

  if (error || !person) {
    return (
      <div className="text-sm text-muted-foreground">
        {error ?? "Person not found."}
      </div>
    );
  }

  const meta = [
    { label: "Village", value: String(person.village ?? "-") },
    { label: "Branch", value: String(person.branch ?? "-") },
    {
      label: "PGPD",
      value: <Badge variant="secondary">{String(person.pgpd_stage ?? "Plan")}</Badge>
    },
    {
      label: "Risk",
      value: (
        <Badge variant={person.risk_status === "At Risk" ? "destructive" : "secondary"}>
          {String(person.risk_status ?? "Normal")}
        </Badge>
      )
    }
  ];

  const sortedInteractions = [...interactions].sort((a, b) =>
    String(b.interaction_date ?? "").localeCompare(String(a.interaction_date ?? ""))
  );
  const sortedProducts = [...products].sort((a, b) =>
    String(b.status ?? "").localeCompare(String(a.status ?? ""))
  );
  const openTasks = tasks.filter((task) => String(task.status ?? "") !== "Done");

  return (
    <DetailPage
      title={String(person.full_name ?? "Person")}
      description="Primary person profile"
      meta={meta}
      actions={
        id ? (
          <Button asChild variant="outline">
            <Link to={`/app/people/${id}/edit`}>Edit profile</Link>
          </Button>
        ) : null
      }
    >
      {relatedError ? (
        <div className="text-sm text-destructive">{relatedError}</div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {relatedLoading ? (
              <div>Loading interactions...</div>
            ) : sortedInteractions.length ? (
              sortedInteractions.slice(0, 3).map((interaction) => (
                <div
                  key={String(interaction.id)}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {String(interaction.interaction_title ?? "Interaction")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {String(interaction.interaction_type ?? "-")} ·{" "}
                      {String(interaction.interaction_date ?? "-")}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {String(interaction.outcome ?? "Pending")}
                  </Badge>
                </div>
              ))
            ) : (
              <div>No interactions logged yet.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {relatedLoading ? (
              <div>Loading household...</div>
            ) : household ? (
              <>
                <div className="text-sm font-medium text-foreground">
                  {String(household.household_name ?? "Household")}
                </div>
                <div>
                  Earning source: {String(household.primary_earning_source ?? "-")}
                </div>
                <div>
                  Seasonality: {String(household.seasonality_profile ?? "-")}
                </div>
              </>
            ) : (
              <div>No household context captured yet.</div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {relatedLoading ? (
              <div>Loading products...</div>
            ) : sortedProducts.length ? (
              sortedProducts.slice(0, 3).map((product) => (
                <div key={String(product.id)} className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {String(product.product_name ?? "Product")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {String(product.product_type ?? "-")}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{formatCurrency(Number(product.amount ?? 0))}</div>
                    <Badge variant="secondary" className="mt-1">
                      {String(product.status ?? "-")}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div>No products linked yet.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {relatedLoading ? (
              <div>Loading tasks...</div>
            ) : openTasks.length ? (
              openTasks.slice(0, 3).map((task) => (
                <div key={String(task.id)}>
                  <div className="text-sm font-medium text-foreground">
                    {String(task.task_title ?? "Task")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due {String(task.due_date ?? "-")}
                  </div>
                </div>
              ))
            ) : (
              <div>No pending tasks.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DetailPage>
  );
}

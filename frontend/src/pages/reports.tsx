import * as React from "react";
import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { GridPattern } from "@/components/ui/grid-pattern";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  countInteractionsSince,
  countPeopleByRisk,
  countProductsByTypeStatus,
  countTasksByStatus,
  listInteractions
} from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

export function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({
    activeLoans: 0,
    atRisk: 0,
    pending: 0,
    interactions: 0
  });
  const [officerSummary, setOfficerSummary] = React.useState<
    Array<{ officerId: string; count: number }>
  >([]);

  React.useEffect(() => {
    if (!profile?.branch) {
      setLoading(false);
      setError("Missing branch information.");
      return;
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);
    const sinceKey = sinceDate.toISOString().slice(0, 10);

    let isMounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      countProductsByTypeStatus(profile.branch, "Loan", "Active"),
      countPeopleByRisk(profile.branch, "At Risk"),
      countTasksByStatus(profile.branch, "Open"),
      countInteractionsSince(profile.branch, sinceKey),
      listInteractions(profile.branch)
    ])
      .then(([activeLoans, atRisk, pending, interactions, allInteractions]) => {
        if (!isMounted) return;
        setStats({ activeLoans, atRisk, pending, interactions });
        const filtered = allInteractions.filter(
          (interaction) => String(interaction.interaction_date ?? "") >= sinceKey
        );
        const grouped = filtered.reduce<Record<string, number>>((acc, interaction) => {
          const officerId = String(interaction.assigned_officer_id ?? "Unknown");
          acc[officerId] = (acc[officerId] ?? 0) + 1;
          return acc;
        }, {});
        const summary = Object.entries(grouped)
          .map(([officerId, count]) => ({ officerId, count }))
          .sort((a, b) => b.count - a.count);
        setOfficerSummary(summary);
      })
      .catch((err) => {
        console.error("Failed to load reports", err);
        if (isMounted) {
          setError("Unable to load reports right now.");
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

  const cards = [
    {
      name: "Active loans",
      description: "Total active loan relationships across the branch.",
      href: "/app/products",
      cta: "View products",
      className: "lg:col-span-2",
      Icon: TrendingUp,
      value: stats.activeLoans
    },
    {
      name: "At-risk customers",
      description: "Customers flagged for protection workflows.",
      href: "/app/people",
      cta: "Review people",
      className: "lg:col-span-1",
      Icon: Users,
      value: stats.atRisk
    },
    {
      name: "Pending follow-ups",
      description: "Open tasks requiring officer action.",
      href: "/app/tasks",
      cta: "View tasks",
      className: "lg:col-span-1",
      Icon: Activity,
      value: stats.pending
    },
    {
      name: "Interactions this week",
      description: "Recent engagement volume across officers.",
      href: "/app/interactions",
      cta: "See interactions",
      className: "lg:col-span-2",
      Icon: BarChart3,
      value: stats.interactions
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Lightweight insights for branch performance and follow-ups.
        </p>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
      </div>
      <BentoGrid className="grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <BentoCard
            key={card.name}
            name={
              <span className="flex items-center gap-2">
                {card.name}
                <NumberTicker value={card.value} className="text-lg font-semibold" />
              </span>
            }
            description={card.description}
            href={card.href}
            cta={card.cta}
            className={card.className}
            Icon={card.Icon}
            background={
              <div className="absolute inset-0">
                <GridPattern className="opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/60" />
              </div>
            }
          />
        ))}
      </BentoGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Officer activity (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading activity...</div>
          ) : officerSummary.length === 0 ? (
            <div className="text-sm text-muted-foreground">No interactions logged yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Interactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officerSummary.map((row) => (
                  <TableRow key={row.officerId}>
                    <TableCell>{row.officerId}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

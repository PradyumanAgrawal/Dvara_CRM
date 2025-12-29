import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { GridPattern } from "@/components/ui/grid-pattern";

const cards = [
  {
    name: "Active loans",
    description: "Total active loan relationships across the branch.",
    href: "/app/products",
    cta: "View products",
    className: "lg:col-span-2",
    Icon: TrendingUp,
    value: "128"
  },
  {
    name: "At-risk customers",
    description: "Customers flagged for protection workflows.",
    href: "/app/people",
    cta: "Review people",
    className: "lg:col-span-1",
    Icon: Users,
    value: "14"
  },
  {
    name: "Pending follow-ups",
    description: "Open tasks requiring officer action.",
    href: "/app/tasks",
    cta: "View tasks",
    className: "lg:col-span-1",
    Icon: Activity,
    value: "22"
  },
  {
    name: "Interactions this week",
    description: "Recent engagement volume across officers.",
    href: "/app/interactions",
    cta: "See interactions",
    className: "lg:col-span-2",
    Icon: BarChart3,
    value: "46"
  }
];

export function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Lightweight insights for branch performance and follow-ups.
        </p>
      </div>
      <BentoGrid className="grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <BentoCard
            key={card.name}
            name={`${card.name} · ${card.value}`}
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
    </div>
  );
}

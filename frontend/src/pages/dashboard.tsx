import { Link } from "react-router-dom";
import { Bell, ClipboardList, Shield, Users } from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";

const bentoCards = [
  {
    name: "People",
    description: "Track primary people, PGPD stage, and risk flags in one view.",
    href: "/app/people",
    cta: "Open people",
    className: "lg:col-span-2",
    Icon: Users
  },
  {
    name: "Tasks",
    description: "Surface follow-ups and ensure field discipline stays tight.",
    href: "/app/tasks",
    cta: "Review tasks",
    className: "lg:col-span-1",
    Icon: ClipboardList
  },
  {
    name: "Risk",
    description: "Highlight at-risk customers and trigger protection workflows.",
    href: "/app/interactions",
    cta: "View interactions",
    className: "lg:col-span-1",
    Icon: Shield
  },
  {
    name: "Follow-ups",
    description: "Never miss the next action date or customer promise.",
    href: "/app/tasks",
    cta: "See follow-ups",
    className: "lg:col-span-2",
    Icon: Bell
  }
];

const taskFeed = [
  {
    id: "task-1",
    title: "Initial financial assessment visit",
    person: "Sita Devi",
    due: "Today",
    status: "Open"
  },
  {
    id: "task-2",
    title: "Insurance discussion",
    person: "Ramesh Kumar",
    due: "Tomorrow",
    status: "At Risk"
  },
  {
    id: "task-3",
    title: "Business / income review",
    person: "Asha Patel",
    due: "This week",
    status: "Suggested"
  }
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Quick view of relationships, risks, and pending actions.
        </p>
      </div>
      <BentoGrid className="grid-cols-1 gap-4 lg:grid-cols-3">
        {bentoCards.map((card) => (
          <BentoCard
            key={card.name}
            name={card.name}
            description={card.description}
            href={card.href}
            cta={card.cta}
            className={card.className}
            Icon={card.Icon}
            background={
              <div className="absolute inset-0">
                <GridPattern className="opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/60" />
              </div>
            }
          />
        ))}
      </BentoGrid>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedList className="items-start">
              {taskFeed.map((task) => (
                <AnimatedListItem key={task.id}>
                  <div className="flex w-full flex-col gap-2 rounded-lg border bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{task.title}</div>
                      <Badge variant="secondary">{task.due}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{task.person}</span>
                      <span>{task.status}</span>
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Link className="block text-foreground hover:underline" to="/app/people/new">
              Create a new person profile
            </Link>
            <Link className="block text-foreground hover:underline" to="/app/interactions">
              Log a field interaction
            </Link>
            <Link className="block text-foreground hover:underline" to="/app/tasks">
              Review open tasks
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

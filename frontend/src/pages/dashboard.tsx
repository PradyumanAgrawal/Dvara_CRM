import * as React from "react";
import { Link } from "react-router-dom";
import { Bell, ClipboardList, Shield, Users } from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/kibo/banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { listPeopleAtRisk, listTasksByOfficer } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

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

export function Dashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = React.useState<Record<string, unknown>[]>([]);
  const [atRisk, setAtRisk] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !profile?.branch) {
      setLoading(false);
      setError("Missing user or branch.");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    Promise.all([listTasksByOfficer(user.uid, profile.branch), listPeopleAtRisk(profile.branch)])
      .then(([taskData, peopleData]) => {
        if (!isMounted) return;
        setTasks(taskData);
        setAtRisk(peopleData);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data", err);
        if (isMounted) {
          setError("Unable to load dashboard data.");
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
  }, [user, profile?.branch]);

  const openTasks = tasks.filter((task) => String(task.status ?? "") !== "Done");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Quick view of relationships, risks, and pending actions.
        </p>
      </div>
      <Banner
        title="Quick actions"
        description="Capture a new profile or log today's follow-ups."
        actions={
          <>
            <Link className="text-sm font-medium text-primary hover:underline" to="/app/people/new">
              New person
            </Link>
            <Link
              className="text-sm font-medium text-primary hover:underline"
              to="/app/interactions/new"
            >
              Log interaction
            </Link>
          </>
        }
      />
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
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading tasks...</div>
            ) : openTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending tasks.</div>
            ) : (
              <AnimatedList className="items-start">
                {openTasks.slice(0, 4).map((task) => (
                  <AnimatedListItem key={String(task.id)}>
                    <div className="flex w-full flex-col gap-2 rounded-lg border bg-background px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">
                          {String(task.task_title ?? "Task")}
                        </div>
                        <Badge variant="secondary">
                          {String(task.due_date ?? "-")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{String(task.primary_person_id ?? "Person")}</span>
                        <span>{String(task.status ?? "Open")}</span>
                      </div>
                    </div>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">At-risk customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            {loading ? (
              <div>Loading risk list...</div>
            ) : atRisk.length === 0 ? (
              <div>No risk flags added yet.</div>
            ) : (
              atRisk.slice(0, 4).map((person) => (
                <Link
                  key={String(person.id)}
                  className="flex items-center justify-between text-foreground hover:underline"
                  to={`/app/people/${person.id}`}
                >
                  <span>{String(person.full_name ?? "Person")}</span>
                  <Badge variant="destructive">At Risk</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

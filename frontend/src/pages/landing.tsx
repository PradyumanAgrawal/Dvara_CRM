import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Announcement } from "@/components/kibo/announcement";
import { Banner } from "@/components/kibo/banner";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useAuth } from "@/providers/auth-provider";

export function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 text-foreground">
      <GridPattern className="opacity-70 [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dvara</div>
          <div className="text-lg font-semibold">Relationship-First CRM</div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Request a demo</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-16 pt-4">
        <section className="grid gap-10 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Announcement
              label="Dvara"
              title="PGPD-first CRM designed for rural finance"
              href="#specs"
            />
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Relationship-led CRM that turns every field touchpoint into revenue and
              retention.
            </h1>
            <p className="text-lg text-muted-foreground">
              Dvara puts primary people, products, and outcomes in one flow so teams
              can grow portfolios without losing context. Built for branch leaders who
              need real-time visibility and officers who need zero-friction follow-ups.
            </p>
            <AnimatedShinyText className="text-sm uppercase tracking-[0.2em]">
              Faster onboarding • Clearer risk management • Higher cross-sell
            </AnimatedShinyText>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/login">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/login">Explore product tour</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "PGPD stages", value: 4 },
                { label: "Primary entities", value: 7 },
                { label: "Follow-up focus", value: 100 }
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-card px-4 py-4">
                  <div className="text-2xl font-semibold">
                    <NumberTicker value={stat.value} />
                    {stat.label === "Follow-up focus" ? "%" : ""}
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-muted/60">
            <CardHeader>
              <CardTitle>Live field pulse</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedList className="items-start">
                {[
                  {
                    id: "pulse-1",
                    title: "Follow-up scheduled",
                    detail: "Sita Devi • Insurance discussion",
                    time: "Today"
                  },
                  {
                    id: "pulse-2",
                    title: "Loan status updated",
                    detail: "Ramesh Kumar • Active loan",
                    time: "Yesterday"
                  },
                  {
                    id: "pulse-3",
                    title: "New interaction logged",
                    detail: "Asha Patel • Financial review",
                    time: "2 days ago"
                  }
                ].map((item) => (
                  <AnimatedListItem key={item.id}>
                    <div className="flex w-full flex-col gap-1 rounded-lg border bg-background px-4 py-3">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{item.detail}</div>
                    </div>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6" id="specs">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Built to sell, support, and scale Dvara&apos;s PGPD philosophy.
            </h2>
            <p className="text-sm text-muted-foreground">
              Every module is scoped to what field teams actually use, so adoption stays high.
            </p>
          </div>

          <BentoGrid className="grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              {
                name: "Primary Person Lens",
                description: "A single profile for every borrower, earner, and decision maker.",
                href: "/login",
                cta: "View profiles",
                className: "lg:col-span-2",
                Icon: Users
              },
              {
                name: "Risk Radar",
                description: "Surface climate, income, and health risk flags instantly.",
                href: "/login",
                cta: "See risk list",
                className: "lg:col-span-1",
                Icon: ShieldCheck
              },
              {
                name: "Pipeline Momentum",
                description: "Track opportunities, meetings, and follow-ups without spreadsheets.",
                href: "/login",
                cta: "Track pipeline",
                className: "lg:col-span-1",
                Icon: BarChart3
              },
              {
                name: "Task Discipline",
                description: "Never lose the next action, even when teams rotate.",
                href: "/login",
                cta: "Review tasks",
                className: "lg:col-span-2",
                Icon: Sparkles
              }
            ].map((card) => (
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
                    <GridPattern className="opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/60" />
                  </div>
                }
              />
            ))}
          </BentoGrid>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-semibold tracking-tight">What teams say they need</h3>
            <p className="text-sm text-muted-foreground">
              Dvara CRM aligns branch leaders and field officers around the same priorities.
            </p>
          </div>
          <Marquee pauseOnHover className="rounded-xl border bg-card">
            {[
              "Branch-wide visibility without extra reporting",
              "Automated follow-ups for insurance and savings",
              "One profile per household decision maker",
              "Lean data capture that keeps visits short",
              "PGPD workflows built in, not bolted on"
            ].map((item) => (
              <div
                key={item}
                className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </Marquee>
        </section>

        <Banner
          title="Ready to roll out Dvara CRM across your branches?"
          description="Move faster with a workflow-led CRM that field teams actually use."
          actions={
            <>
              <Button asChild>
                <Link to="/login">Start with a branch</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Talk to sales</Link>
              </Button>
            </>
          }
        />
      </main>
    </div>
  );
}

import { Navigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { useAuth } from "@/providers/auth-provider";

export function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 text-foreground">
      <GridPattern className="opacity-70 [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dvara</div>
          <div className="text-lg font-semibold">Relationship-First CRM</div>
        </div>
        <Button asChild variant="outline">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Capture the right context, trigger the right action.
          </h1>
          <p className="text-lg text-muted-foreground">
            Dvara CRM keeps rural finance teams aligned on people, products, and
            interactions so every follow-up is deliberate.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/login">Get started</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/login">View dashboard</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "PGPD-first workflows",
              "Field-ready task discipline",
              "Lean data capture",
              "Branch-aware visibility"
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-card px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What you get on day one</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Primary person profiles, interactions, and follow-up tasks.</p>
            <p>Loan status workflows that trigger income reviews.</p>
            <p>Risk flags that drive insurance conversations.</p>
            <p>All data stays in Firestore for rapid iteration.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

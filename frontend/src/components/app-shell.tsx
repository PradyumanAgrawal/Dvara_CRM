import { signOut } from "firebase/auth";
import { Outlet } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

export function AppShell() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur">
            <Breadcrumbs />
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {profile?.display_name ?? user?.email ?? ""}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut(auth)}>
                Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

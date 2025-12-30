import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", to: "/app" },
      { label: "People", to: "/app/people" },
      { label: "Products", to: "/app/products" },
      { label: "Interactions", to: "/app/interactions" },
      { label: "Tasks", to: "/app/tasks" }
    ]
  },
  {
    label: "CRM",
    items: [
      { label: "Opportunities", to: "/app/opportunities" },
      { label: "Meetings", to: "/app/meetings" },
      { label: "Phone Calls", to: "/app/phone-calls" },
      { label: "RFPs", to: "/app/rfps" },
      { label: "Invoices", to: "/app/invoices" },
      { label: "Reports", to: "/app/reports" }
    ]
  },
  {
    label: "Admin",
    items: [{ label: "Users", to: "/app/settings/users" }]
  }
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r bg-card px-4 py-6">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Dvara</div>
        <div className="text-lg font-semibold">CRM</div>
      </div>
      <div className="flex flex-1 flex-col gap-6">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/app"}>
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-muted-foreground transition-colors",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                    >
                      {item.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

import { Link, useLocation } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const labelMap: Record<string, string> = {
  app: "Dashboard",
  people: "People",
  products: "Products",
  interactions: "Interactions",
  tasks: "Tasks",
  setup: "Profile Setup",
  edit: "Edit",
  opportunities: "Opportunities",
  meetings: "Meetings",
  "phone-calls": "Phone Calls",
  rfps: "RFPs",
  invoices: "Invoices",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  new: "New"
};

function getLabel(segment: string) {
  return labelMap[segment] ?? "Detail";
}

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    return {
      segment,
      label: getLabel(segment),
      path,
      isLast: index === segments.length - 1
    };
  });

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            {crumb.isLast ? (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={crumb.path}>{crumb.label}</Link>
              </BreadcrumbLink>
            )}
            {index < crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

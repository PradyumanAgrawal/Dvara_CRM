import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/pages/dashboard";
import { InteractionsCreate } from "@/pages/interactions-create";
import { InteractionsEdit } from "@/pages/interactions-edit";
import { InteractionsList } from "@/pages/interactions-list";
import { InvoicesCreate } from "@/pages/invoices-create";
import { InvoicesList } from "@/pages/invoices-list";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/login";
import { MeetingsCreate } from "@/pages/meetings-create";
import { MeetingsList } from "@/pages/meetings-list";
import { OpportunitiesCreate } from "@/pages/opportunities-create";
import { OpportunitiesList } from "@/pages/opportunities-list";
import { PhoneCallsCreate } from "@/pages/phone-calls-create";
import { PhoneCallsList } from "@/pages/phone-calls-list";
import { PeopleCreate } from "@/pages/people-create";
import { PeopleDetail } from "@/pages/people-detail";
import { PeopleEdit } from "@/pages/people-edit";
import { PeopleList } from "@/pages/people-list";
import { ProductsCreate } from "@/pages/products-create";
import { ProductsDetail } from "@/pages/products-detail";
import { ProductsEdit } from "@/pages/products-edit";
import { ProductsList } from "@/pages/products-list";
import { ProfileSetup } from "@/pages/profile-setup";
import { Reports } from "@/pages/reports";
import { RfpsCreate } from "@/pages/rfps-create";
import { RfpsList } from "@/pages/rfps-list";
import { TasksList } from "@/pages/tasks-list";
import { RequireAuth } from "@/providers/auth-provider";

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "setup", element: <ProfileSetup /> },
      { path: "people", element: <PeopleList /> },
      { path: "people/new", element: <PeopleCreate /> },
      { path: "people/:id/edit", element: <PeopleEdit /> },
      { path: "people/:id", element: <PeopleDetail /> },
      { path: "products", element: <ProductsList /> },
      { path: "products/new", element: <ProductsCreate /> },
      { path: "products/:id/edit", element: <ProductsEdit /> },
      { path: "products/:id", element: <ProductsDetail /> },
      { path: "interactions", element: <InteractionsList /> },
      { path: "interactions/new", element: <InteractionsCreate /> },
      { path: "interactions/:id/edit", element: <InteractionsEdit /> },
      { path: "tasks", element: <TasksList /> },
      { path: "opportunities", element: <OpportunitiesList /> },
      { path: "opportunities/new", element: <OpportunitiesCreate /> },
      { path: "meetings", element: <MeetingsList /> },
      { path: "meetings/new", element: <MeetingsCreate /> },
      { path: "phone-calls", element: <PhoneCallsList /> },
      { path: "phone-calls/new", element: <PhoneCallsCreate /> },
      { path: "rfps", element: <RfpsList /> },
      { path: "rfps/new", element: <RfpsCreate /> },
      { path: "invoices", element: <InvoicesList /> },
      { path: "invoices/new", element: <InvoicesCreate /> },
      { path: "reports", element: <Reports /> },
      {
        path: "settings/users",
        element: (
          <div className="text-sm text-muted-foreground">User settings coming soon.</div>
        )
      }
    ]
  }
]);

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/templates/page-header";

export type MetaItem = {
  label: string;
  value: React.ReactNode;
};

type DetailPageProps = {
  title: string;
  description?: string;
  meta?: MetaItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function DetailPage({ title, description, meta, actions, children }: DetailPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 motion-reduce:animate-none">
      <PageHeader title={title} description={description} actions={actions} />

      {meta && meta.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-base font-semibold">{item.value}</CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {children ? <div className="space-y-6">{children}</div> : null}
    </div>
  );
}

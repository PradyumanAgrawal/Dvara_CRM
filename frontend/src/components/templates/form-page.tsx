import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/templates/page-header";

type FormPageProps = {
  title: string;
  description?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  cancelHref?: string;
  children: React.ReactNode;
};

export function FormPage({
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  cancelHref,
  children
}: FormPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <Card>
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {cancelHref ? (
              <Button asChild type="button" variant="outline">
                <Link to={cancelHref}>Cancel</Link>
              </Button>
            ) : null}
            <Button type="submit">{submitLabel}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

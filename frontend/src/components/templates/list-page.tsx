import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/templates/page-header";
import {
  DataTable,
  type ColumnDef,
  type TableFilter
} from "@/components/templates/data-table";

type ListPageProps<T> = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: TableFilter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (name: string, value: string) => void;
  columns: ColumnDef<T>[];
  data: T[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ListPage<T>({
  title,
  description,
  actionLabel,
  onAction,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  columns,
  data,
  emptyTitle,
  emptyDescription
}: ListPageProps<T>) {
  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 motion-reduce:animate-none">
      <PageHeader
        title={title}
        description={description}
        actions={
          actionLabel ? (
            <Button onClick={onAction} type="button">
              {actionLabel}
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export type { ColumnDef };

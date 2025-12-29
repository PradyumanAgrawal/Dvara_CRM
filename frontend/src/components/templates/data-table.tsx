import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export type ColumnDef<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export type TableFilter = {
  name: string;
  label: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: TableFilter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (name: string, value: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  filters = [],
  filterValues,
  onFilterChange,
  emptyTitle = "No data yet",
  emptyDescription = "Create your first record to get started."
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = React.useState("");
  const [localFilters, setLocalFilters] = React.useState<Record<string, string>>({});

  const search = searchValue ?? localSearch;
  const activeFilters = filterValues ?? localFilters;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setLocalSearch(nextValue);
    onSearchChange?.(nextValue);
  };

  const handleFilterChange = (name: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
    onFilterChange?.(name, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <Input placeholder={searchPlaceholder} value={search} onChange={handleSearchChange} />
        </div>
        {filters.length > 0 ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {filters.map((filter) => (
              <Select
                key={filter.name}
                value={activeFilters[filter.name] ?? ""}
                onValueChange={(value) => handleFilterChange(filter.name, value)}
              >
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={filter.placeholder ?? filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="rounded-md border border-dashed px-6 py-10 text-center">
          <div className="text-sm font-medium">{emptyTitle}</div>
          <div className="mt-1 text-sm text-muted-foreground">{emptyDescription}</div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={`${column.header}-${index}`} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={`${rowIndex}-${colIndex}`} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

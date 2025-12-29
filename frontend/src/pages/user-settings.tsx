import * as React from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRecords } from "@/lib/firestore";
import { useAuth } from "@/providers/auth-provider";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
};

export function UserSettings() {
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile?.branch) {
      setLoading(false);
      setError("Missing branch information.");
      return;
    }
    if (profile.role !== "Admin") {
      setLoading(false);
      setError("Admin access required.");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    listRecords("users", profile.branch)
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map((doc) => ({
          id: String(doc.id),
          name: String(doc.display_name ?? "User"),
          email: String(doc.email ?? "-"),
          role: String(doc.role ?? "FieldOfficer"),
          branch: String(doc.branch ?? "-")
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error("Failed to load users", err);
        if (isMounted) {
          setError("Unable to load users.");
          setRows([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.branch, profile?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage access, roles, and branches for the team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading users...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No users yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.role}</Badge>
                    </TableCell>
                    <TableCell>{row.branch}</TableCell>
                    <TableCell>
                      <Link className="text-primary hover:underline" to={`/app/settings/users/${row.id}/edit`}>
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

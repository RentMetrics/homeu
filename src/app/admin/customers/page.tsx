"use client";

import { Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const renters: Doc<"renters">[] | undefined = useQuery(api.renters.getAllRenters);

  const filtered = renters?.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">
          View and manage registered renters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Renters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          {renters === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No customers found.
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Showing {filtered.length} of {renters.length} customers
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {r.firstName} {r.lastName}
                        </TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.phoneNumber}</TableCell>
                        <TableCell>
                          {r.city}, {r.state} {r.zipCode}
                        </TableCell>
                        <TableCell>{r.employer}</TableCell>
                        <TableCell className="text-right">
                          ${r.income.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {r.verified ? (
                            <Badge variant="default">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Statement {
  _id: string;
  month: string;
  statementNumber: string;
  totalDue: number;
  dueDate: number;
  status: string;
}

interface StatementHistoryProps {
  userId: string;
  limit?: number;
  onViewStatement?: (statementId: string) => void;
}

export function StatementHistory({
  userId,
  limit = 12,
  onViewStatement
}: StatementHistoryProps) {
  const statements = useQuery(api.statements.getRenterStatements, {
    renterId: userId,
    limit
  });

  if (!statements) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading statements...</p>
        </CardContent>
      </Card>
    );
  }

  if (statements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No statement history available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "sent":
      case "viewed":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Due
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Partial
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Statement History
        </CardTitle>
        <CardDescription>
          Your past rent statements and payment records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Statement #</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.map((statement: Statement) => (
              <TableRow key={statement._id}>
                <TableCell className="font-medium">
                  {statement.month}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {statement.statementNumber}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${statement.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {format(new Date(statement.dueDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {getStatusBadge(statement.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onViewStatement && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewStatement(statement._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

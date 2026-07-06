"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  FileText,
  Plus,
  Building2,
  Mail,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const PROVIDER_LABELS: Record<string, string> = {
  entrata: "Entrata",
  yardi: "Yardi Voyager",
  realpage: "RealPage",
  buildium: "Buildium",
  appfolio: "AppFolio",
  rentmanager: "Rent Manager",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700", icon: Clock },
  received: { label: "Received", className: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  under_review: { label: "Under Review", className: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Not Approved", className: "bg-red-100 text-red-700", icon: XCircle },
  failed: { label: "Delivery Failed", className: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const SECTION_LABELS: Record<string, string> = {
  personal: "Personal Info",
  employment: "Employment",
  rental_history: "Rental History",
  financial: "Financial Verification",
  household: "Household",
};

export default function ApplicationsPage() {
  const { user } = useUser();
  const submissions = useQuery(
    api.pms.getMySubmissions,
    user?.id ? { userId: user.id } : "skip"
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">
            Track applications you&apos;ve sent to properties — directly into their
            management system or by email.
          </p>
        </div>
        <Link href="/dashboard/application">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            My Application
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Submitted Applications</h3>

        {submissions === undefined ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-gray-700">No applications sent yet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Your HomeU profile already holds your rental history, employment,
              and verification info. Complete your application once, then send it
              to any property in seconds.
            </p>
            <Link href="/dashboard/application">
              <Button className="mt-4">
                <FileText className="mr-2 h-4 w-4" />
                Complete My Application
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((s: any) => {
              const status = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.submitted;
              const StatusIcon = status.icon;
              const isDirect = s.channel === "pms";
              return (
                <div key={s._id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          isDirect ? "bg-emerald-50" : "bg-blue-50"
                        }`}
                      >
                        <Building2
                          className={`h-6 w-6 ${
                            isDirect ? "text-emerald-600" : "text-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{s.propertyName}</div>
                        <div className="text-sm text-gray-500">
                          {s.propertyAddress}
                          {s.pmCompanyName ? ` · ${s.pmCompanyName}` : ""}
                        </div>
                      </div>
                    </div>
                    <Badge className={status.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {isDirect ? (
                        <>
                          <Zap className="h-3 w-3 text-emerald-600" />
                          Sent directly to{" "}
                          {PROVIDER_LABELS[s.provider] ?? s.provider ?? "PMS"}
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3 text-blue-500" />
                          Delivered to property manager by email
                        </>
                      )}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(s.submittedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {s.externalApplicationId && (
                      <>
                        <span>·</span>
                        <span>Ref: {s.externalApplicationId}</span>
                      </>
                    )}
                  </div>

                  {s.sectionsIncluded && s.sectionsIncluded.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.sectionsIncluded.map((section: string) => (
                        <Badge
                          key={section}
                          variant="outline"
                          className="text-[10px] text-gray-600"
                        >
                          {SECTION_LABELS[section] ?? section}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {s.status === "failed" && s.error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
                      {s.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

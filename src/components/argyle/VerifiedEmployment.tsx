"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
} from "lucide-react";
// ========================================
// FORMATTING HELPERS
// ========================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEmploymentDuration(months: number): string {
  if (months < 1) return "Less than a month";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (remainingMonths > 0) parts.push(`${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`);
  return parts.join(" ");
}

function formatPayFrequency(frequency: string): string {
  return frequency
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface VerifiedEmploymentProps {
  employerName: string;
  position: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  income?: number;
  payFrequency?: string;
  verifiedAt?: number;
  employerCity?: string;
  employerState?: string;
}

export function VerifiedEmployment({
  employerName,
  position,
  startDate,
  endDate,
  isCurrent = true,
  income,
  payFrequency,
  verifiedAt,
  employerCity,
  employerState,
}: VerifiedEmploymentProps) {
  // Calculate employment duration if dates available
  let duration: string | null = null;
  if (startDate) {
    const months = Math.floor(
      (new Date(endDate || new Date()).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    duration = formatEmploymentDuration(months);
  }

  const location =
    employerCity && employerState
      ? `${employerCity}, ${employerState}`
      : employerCity || employerState || null;

  return (
    <Card className="border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{employerName}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {position}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isCurrent ? "default" : "secondary"}
            className={isCurrent ? "bg-green-600" : ""}
          >
            {isCurrent ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Current
              </>
            ) : (
              "Past"
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {/* Employment Period */}
        {startDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Employment Period</span>
            </div>
            <span className="font-medium">
              {formatDate(startDate)}
              {" — "}
              {endDate ? formatDate(endDate) : "Present"}
            </span>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Duration</span>
            </div>
            <span className="font-medium">{duration}</span>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
            </div>
            <span className="font-medium">{location}</span>
          </div>
        )}

        {/* Income */}
        {income && income > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <DollarSign className="h-4 w-4" />
              <span>Annual Income</span>
            </div>
            <span className="font-medium">{formatCurrency(income)}</span>
          </div>
        )}

        {/* Pay Frequency */}
        {payFrequency && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Pay Frequency</span>
            </div>
            <span className="font-medium">{formatPayFrequency(payFrequency)}</span>
          </div>
        )}

        {/* Verification Badge */}
        {verifiedAt && (
          <div className="mt-2 pt-3 border-t flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Verified via Argyle</span>
            </div>
            <span className="text-gray-400">
              {new Date(verifiedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EmploymentHistoryListProps {
  employments: Array<{
    employerName: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    basePay?: number;
    payFrequency?: string;
    employerCity?: string;
    employerState?: string;
    verifiedAt: number;
  }>;
}

export function EmploymentHistoryList({ employments }: EmploymentHistoryListProps) {
  if (employments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No employment history recorded</p>
          <p className="text-sm text-gray-400 mt-1">
            Connect your payroll account to verify your employment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {employments.map((employment, index) => (
        <VerifiedEmployment
          key={`${employment.employerName}-${employment.startDate}-${index}`}
          employerName={employment.employerName}
          position={employment.jobTitle}
          startDate={employment.startDate}
          endDate={employment.endDate}
          isCurrent={employment.isCurrent}
          income={employment.basePay}
          payFrequency={employment.payFrequency}
          verifiedAt={employment.verifiedAt}
          employerCity={employment.employerCity}
          employerState={employment.employerState}
        />
      ))}
    </div>
  );
}

"use client";

import { Home, FileText, Download, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const rentalHistory = [
  {
    address: "123 Main St, Apt 4B",
    city: "San Francisco, CA",
    period: "Jan 2023 - Present",
    rent: "$2,500",
    status: "Current",
    documents: 3,
  },
  {
    address: "456 Oak Ave, Unit 12",
    city: "Oakland, CA",
    period: "Mar 2021 - Dec 2022",
    rent: "$2,200",
    status: "Past",
    documents: 5,
  },
  {
    address: "789 Pine St, #303",
    city: "San Jose, CA",
    period: "Jun 2019 - Feb 2021",
    rent: "$1,800",
    status: "Past",
    documents: 4,
  },
];

const documents = [
  {
    name: "Current Lease Agreement",
    type: "Lease",
    date: "Jan 1, 2023",
    property: "123 Main St",
  },
  {
    name: "Move-in Inspection",
    type: "Inspection",
    date: "Jan 1, 2023",
    property: "123 Main St",
  },
  {
    name: "Previous Lease",
    type: "Lease",
    date: "Mar 1, 2021",
    property: "456 Oak Ave",
  },
];

export default function RentalHistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Rental History</h2>
        <p className="text-muted-foreground">
          View and manage your rental history and documents.
        </p>
      </div>

      {/* Current Rental */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Current Rental</h3>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Home className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium">123 Main St, Apt 4B</p>
            <p className="text-sm text-gray-500">San Francisco, CA</p>
          </div>
          <div className="text-right">
            <p className="font-medium">$2,500/month</p>
            <p className="text-sm text-gray-500">Since Jan 2023</p>
          </div>
        </div>
      </div>

      {/* Rental History */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Rental History</h3>
        <div className="space-y-4">
          {rentalHistory.map((rental, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Home className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{rental.address}</p>
                  <p className="text-sm text-gray-500">{rental.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{rental.rent}/month</p>
                  <p className="text-sm text-gray-500">{rental.period}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Documents</h3>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    {doc.type} • {doc.property}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-8">
            <div className="relative pl-8">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Home className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Moved to Current Residence</p>
                <p className="text-sm text-gray-500">January 1, 2023</p>
                <p className="text-sm text-gray-500 mt-1">123 Main St, Apt 4B</p>
              </div>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Home className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">Previous Residence</p>
                <p className="text-sm text-gray-500">March 1, 2021 - December 31, 2022</p>
                <p className="text-sm text-gray-500 mt-1">456 Oak Ave, Unit 12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
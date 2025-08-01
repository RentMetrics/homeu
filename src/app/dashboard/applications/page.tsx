"use client";

import { FileText, Upload, Download, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const applications = [
  {
    id: "APP-001",
    property: "Sunset Apartments",
    status: "In Progress",
    date: "Feb 15, 2024",
    documents: 3,
  },
  {
    id: "APP-002",
    property: "Ocean View Condos",
    status: "Submitted",
    date: "Jan 30, 2024",
    documents: 5,
  },
];

const savedDocuments = [
  {
    name: "Driver's License",
    type: "ID",
    date: "Feb 1, 2024",
  },
  {
    name: "Pay Stub - January",
    type: "Income",
    date: "Feb 1, 2024",
  },
  {
    name: "Bank Statement",
    type: "Financial",
    date: "Feb 1, 2024",
  },
];

export default function ApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Applications</h2>
        <p className="text-muted-foreground">
          Manage your rental applications and documents.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button className="h-auto py-4">
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
        <Button variant="outline" className="h-auto py-4">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
        <Button variant="outline" className="h-auto py-4">
          <Download className="mr-2 h-4 w-4" />
          Download Profile
        </Button>
      </div>

      {/* Active Applications */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Active Applications</h3>
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{app.property}</p>
                  <p className="text-sm text-gray-500">ID: {app.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{app.status}</p>
                  <p className="text-sm text-gray-500">{app.date}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Documents */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Saved Documents</h3>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload New
          </Button>
        </div>
        <div className="space-y-4">
          {savedDocuments.map((doc, index) => (
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
                  <p className="text-sm text-gray-500">{doc.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Profile */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Application Profile</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-4">Personal Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium">John Doe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">john@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">(555) 123-4567</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Employment</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Employer</span>
                <span className="font-medium">Tech Corp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Position</span>
                <span className="font-medium">Software Engineer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Income</span>
                <span className="font-medium">$120,000/year</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
} 
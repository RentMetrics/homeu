"use client";

import { useEffect, useState } from "react";
import { PROVIDER_SETUP } from "@/lib/pms/setup";
import {
  Plug,
  Search,
  Loader2,
  Trash2,
  Pencil,
  Plus,
  MapPin,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const PROVIDERS = [
  { value: "entrata", label: "Entrata" },
  { value: "yardi", label: "Yardi Voyager" },
  { value: "realpage", label: "RealPage" },
  { value: "buildium", label: "Buildium" },
  { value: "appfolio", label: "AppFolio (email delivery)" },
  { value: "rentmanager", label: "Rent Manager" },
  { value: "email", label: "Email only" },
];

interface ConnectionForm {
  propertyId: string;
  propertyName: string;
  provider: string;
  status: string;
  externalPropertyId: string;
  externalSourceId: string;
  apiBaseUrl: string;
  credentialRef: string;
  fallbackEmail: string;
  notes: string;
}

const emptyForm: ConnectionForm = {
  propertyId: "",
  propertyName: "",
  provider: "entrata",
  status: "active",
  externalPropertyId: "",
  externalSourceId: "",
  apiBaseUrl: "",
  credentialRef: "",
  fallbackEmail: "",
  notes: "",
};

export default function PmsConnectionsPage() {
  const connections = useQuery(api.pms.listConnections, {});
  const upsertConnection = useMutation(api.pms.upsertConnection);
  const deleteConnection = useMutation(api.pms.deleteConnection);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ConnectionForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");

  // Credential presence check (booleans only — values never leave the server)
  const [credCheck, setCredCheck] = useState<{
    ready: boolean;
    vars: Array<{ name: string; present: boolean; scope: string }>;
  } | null>(null);

  useEffect(() => {
    if (!isDialogOpen) return;
    setCredCheck(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          provider: form.provider,
          ref: form.credentialRef || form.provider,
        });
        const res = await fetch(`/api/admin/pms/credential-check?${params}`, {
          signal: controller.signal,
        });
        if (res.ok) setCredCheck(await res.json());
      } catch {
        // aborted or offline — leave panel in loading state
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isDialogOpen, form.provider, form.credentialRef]);

  const searchResults = useQuery(
    api.multifamilyproperties.searchProperties,
    isDialogOpen && propertySearch.length >= 2 && !form.propertyId
      ? { searchQuery: propertySearch, limit: 6 }
      : "skip"
  );

  const set = (key: keyof ConnectionForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openNew = () => {
    setForm(emptyForm);
    setPropertySearch("");
    setIsDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setForm({
      propertyId: c.propertyId,
      propertyName: c.propertyName,
      provider: c.provider,
      status: c.status,
      externalPropertyId: c.externalPropertyId ?? "",
      externalSourceId: c.externalSourceId ?? "",
      apiBaseUrl: c.apiBaseUrl ?? "",
      credentialRef: c.credentialRef ?? "",
      fallbackEmail: c.fallbackEmail ?? "",
      notes: c.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.propertyId) {
      toast.error("Select a property first.");
      return;
    }
    setIsSaving(true);
    try {
      await upsertConnection({
        propertyId: form.propertyId,
        provider: form.provider,
        status: form.status,
        externalPropertyId: form.externalPropertyId || undefined,
        externalSourceId: form.externalSourceId || undefined,
        apiBaseUrl: form.apiBaseUrl || undefined,
        credentialRef: form.credentialRef || undefined,
        fallbackEmail: form.fallbackEmail || undefined,
        notes: form.notes || undefined,
      });
      toast.success("PMS connection saved.");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (connectionId: Id<"pmsConnections">, name: string) => {
    if (!confirm(`Remove the PMS connection for ${name}?`)) return;
    try {
      await deleteConnection({ connectionId });
      toast.success("Connection removed.");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to remove connection.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Plug className="h-6 w-6" />
            PMS Connections
          </h1>
          <p className="text-muted-foreground">
            Connect properties to their management software so renters can
            submit applications directly — no online forms.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Property
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {connections === undefined ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">
              No PMS connections yet. Connect a property to enable direct
              application submission.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Last Submission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c: any) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="font-medium">{c.propertyName}</div>
                      <div className="text-xs text-gray-500">
                        {c.propertyCity}, {c.propertyState}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        <Zap className="h-3 w-3 mr-1" />
                        {PROVIDERS.find((p) => p.value === c.provider)?.label ??
                          c.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.externalPropertyId || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.lastSubmissionAt
                        ? `${new Date(c.lastSubmissionAt).toLocaleDateString()} (${c.lastSubmissionStatus})`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c._id, c.propertyName)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.propertyId ? "PMS Connection" : "Connect a Property"}
            </DialogTitle>
            <DialogDescription>
              Credentials are read from server env vars (PMS_&#123;REF&#125;_*) —
              never stored in the database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!form.propertyId ? (
              <div className="space-y-2">
                <Label>Property</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search properties by name..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                  />
                </div>
                {propertySearch.length >= 2 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {searchResults === undefined ? (
                      <div className="p-3 text-sm text-gray-500">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No matches.</div>
                    ) : (
                      searchResults.map((p: any) => (
                        <button
                          key={p.propertyId}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              propertyId: p.propertyId,
                              propertyName: p.propertyName,
                              fallbackEmail: f.fallbackEmail || p.pmEmail || "",
                            }))
                          }
                          className="w-full text-left p-3 hover:bg-gray-50 text-sm"
                        >
                          <div className="font-medium">{p.propertyName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {p.city}, {p.state}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm bg-gray-50 border rounded-lg p-3 font-medium">
                {form.propertyName}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={set("provider")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>External Property ID</Label>
                <Input
                  placeholder="ID in the PMS"
                  value={form.externalPropertyId}
                  onChange={(e) => set("externalPropertyId")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lead Source ID</Label>
                <Input
                  placeholder="e.g. HomeU"
                  value={form.externalSourceId}
                  onChange={(e) => set("externalSourceId")(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input
                placeholder="https://client.entrata.com"
                value={form.apiBaseUrl}
                onChange={(e) => set("apiBaseUrl")(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credential Ref</Label>
                <Input
                  placeholder="ACME → PMS_ACME_*"
                  value={form.credentialRef}
                  onChange={(e) => set("credentialRef")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fallback Email</Label>
                <Input
                  type="email"
                  placeholder="manager@property.com"
                  value={form.fallbackEmail}
                  onChange={(e) => set("fallbackEmail")(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Internal notes"
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
              />
            </div>

            {/* Setup guide for the selected provider */}
            {PROVIDER_SETUP[form.provider] && (
              <div className="rounded-lg border bg-gray-50 p-3 space-y-2 text-xs">
                <div className="font-medium text-gray-700">
                  Setup: {PROVIDER_SETUP[form.provider].label}
                </div>
                <p className="text-gray-500">
                  {PROVIDER_SETUP[form.provider].accessSummary} Full playbook:{" "}
                  <code>{PROVIDER_SETUP[form.provider].docPath}</code>
                </p>
                {credCheck === null ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking server
                    credentials...
                  </div>
                ) : credCheck.vars.length > 0 ? (
                  <div className="space-y-1">
                    {credCheck.vars.map((v) => (
                      <div key={v.name} className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            v.present ? "bg-emerald-500" : "bg-red-400"
                          }`}
                        />
                        <code className="text-gray-600">{v.name}</code>
                        <span className="text-gray-400">
                          {v.scope === "fallback"
                            ? "(email fallback)"
                            : v.present
                            ? "set"
                            : "missing"}
                        </span>
                      </div>
                    ))}
                    {!credCheck.ready && (
                      <p className="text-amber-600 pt-1">
                        Missing credentials — submissions will fall back to email
                        until these env vars are set.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Connection"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import {
  Search,
  Building2,
  Upload,
  Loader2,
  ImageIcon,
  Trash2,
  Star,
  FileSpreadsheet,
  CheckCircle,
  X,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────
type Property = {
  _id: Id<"multifamilyproperties">;
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  yearBuilt: number;
  averageUnitSize: number;
  pmCompanyName?: string;
  pmWebsite?: string;
  pmEmail?: string;
  pmPhone?: string;
  pmContactName?: string;
  pmContactTitle?: string;
  pmNotes?: string;
  [key: string]: unknown;
};

type PropertyImage = {
  _id: Id<"propertyImages">;
  propertyId: string;
  storageId: Id<"_storage">;
  fileName: string;
  description?: string;
  isPrimary: boolean;
  uploadedAt: number;
  url: string | null;
};

type RentRecord = {
  _id: string;
  month: string;
  averageRent: number;
  minRent: number;
  maxRent: number;
  rentPerSqFt: number;
  totalRevenue: number;
  unitsRented: number;
  totalUnits: number;
};

type OccupancyRecord = {
  _id: string;
  month: string;
  occupancyRate: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalUnits: number;
};

type ConcessionRecord = {
  _id: string;
  month: string;
  concessionType: string;
  concessionAmount: number;
  concessionDuration: number;
  unitsWithConcessions: number;
  totalUnits: number;
};

// ═════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════
export default function PropertyDatabasePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Property Database
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse properties, manage images &amp; PM contacts, and upload market
          data.
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">
            <Search className="h-4 w-4 mr-2" />
            Browse &amp; Search
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Market Data Upload
          </TabsTrigger>
          <TabsTrigger value="add-property">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Browse & Search ──────────────────────────────── */}
        <TabsContent value="browse">
          <BrowseTab
            onSelectProperty={(p) => {
              setSelectedProperty(p);
              setDetailOpen(true);
            }}
          />
        </TabsContent>

        {/* ── Tab 2: Market Data Upload ───────────────────────────── */}
        <TabsContent value="upload">
          <MarketDataUploadTab />
        </TabsContent>

        {/* ── Tab 3: Add Property ──────────────────────────────────── */}
        <TabsContent value="add-property">
          <AddPropertyTab />
        </TabsContent>
      </Tabs>

      {/* ── Property Detail Dialog ─────────────────────────────────── */}
      {selectedProperty && (
        <PropertyDetailDialog
          property={selectedProperty}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// BROWSE & SEARCH TAB
// ═════════════════════════════════════════════════════════════════════
function BrowseTab({
  onSelectProperty,
}: {
  onSelectProperty: (p: Property) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const states = useQuery(api.multifamilyproperties.getDistinctStates);
  const cities = useQuery(
    api.multifamilyproperties.getCitiesByState,
    stateFilter ? { state: stateFilter } : "skip"
  );
  const properties = useQuery(api.multifamilyproperties.searchProperties, {
    searchQuery: searchQuery || undefined,
    city: cityFilter || undefined,
    state: stateFilter || undefined,
    limit: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={stateFilter}
            onValueChange={(v) => {
              setStateFilter(v === "all" ? "" : v);
              setCityFilter("");
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states?.map((s: string) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={cityFilter}
            onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}
            disabled={!stateFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={stateFilter ? "City" : "Select state first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities?.map((c: string) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Table */}
        {properties === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No properties found.
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {properties.length} properties
            </div>
            <div className="border rounded-lg overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Year Built</TableHead>
                    <TableHead>PM Company</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p: Property) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">
                        {p.propertyName}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.address}
                      </TableCell>
                      <TableCell>{p.city}</TableCell>
                      <TableCell>{p.state}</TableCell>
                      <TableCell className="text-right">
                        {p.totalUnits}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.yearBuilt}
                      </TableCell>
                      <TableCell>
                        {p.pmCompanyName ? (
                          <Badge variant="secondary">{p.pmCompanyName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectProperty(p)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
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
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROPERTY DETAIL DIALOG
// ═════════════════════════════════════════════════════════════════════
function PropertyDetailDialog({
  property,
  open,
  onOpenChange,
}: {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detailTab, setDetailTab] = useState("images");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {property.propertyName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {property.address}, {property.city}, {property.state}{" "}
            {property.zipCode} &mdash; {property.totalUnits} units &mdash;
            Built {property.yearBuilt}
          </p>
        </DialogHeader>

        <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-1" />
              Images
            </TabsTrigger>
            <TabsTrigger value="pm-contact">
              <Building2 className="h-4 w-4 mr-1" />
              PM Contact
            </TabsTrigger>
            <TabsTrigger value="market-data">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Market Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <PropertyImagesSection propertyId={property.propertyId} />
          </TabsContent>

          <TabsContent value="pm-contact">
            <PMContactSection property={property} />
          </TabsContent>

          <TabsContent value="market-data">
            <MarketDataSection propertyId={property.propertyId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ═════════════════════════════════════════════════════════════════════
// A. PROPERTY IMAGES SECTION
// ═════════════════════════════════════════════════════════════════════
function PropertyImagesSection({ propertyId }: { propertyId: string }) {
  const images = useQuery(api.propertyImages.getImagesByProperty, {
    propertyId,
  });
  const generateUploadUrl = useMutation(
    api.propertyImages.generateUploadUrl
  );
  const saveImage = useMutation(api.propertyImages.saveImage);
  const deleteImage = useMutation(api.propertyImages.deleteImage);
  const setPrimary = useMutation(api.propertyImages.setPrimaryImage);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get upload URL
      const { url } = await generateUploadUrl();

      // 2. Upload the file
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Save metadata
      const isFirst = !images || images.length === 0;
      await saveImage({
        propertyId,
        storageId,
        fileName: file.name,
        isPrimary: isFirst,
      });

      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: Id<"propertyImages">) => {
    try {
      await deleteImage({ imageId });
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId: Id<"propertyImages">) => {
    try {
      await setPrimary({ imageId });
      toast.success("Primary image updated");
    } catch {
      toast.error("Failed to update primary image");
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Property Images</h3>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Upload Image
          </Button>
        </div>
      </div>

      {images === undefined ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
          No images uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img: PropertyImage) => (
            <div
              key={img._id}
              className="relative group border rounded-lg overflow-hidden"
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.fileName}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              {img.isPrimary && (
                <Badge className="absolute top-2 left-2" variant="default">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(img._id)}
                  >
                    <Star className="h-3.5 w-3.5 mr-1" />
                    Primary
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(img._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs p-1 truncate text-muted-foreground">
                {img.fileName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// B. PM CONTACT SECTION
// ═════════════════════════════════════════════════════════════════════
function PMContactSection({ property }: { property: Property }) {
  const updatePMContact = useMutation(
    api.multifamilyproperties.updatePMContact
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pmCompanyName: property.pmCompanyName || "",
    pmWebsite: property.pmWebsite || "",
    pmEmail: property.pmEmail || "",
    pmPhone: property.pmPhone || "",
    pmContactName: property.pmContactName || "",
    pmContactTitle: property.pmContactTitle || "",
    pmNotes: property.pmNotes || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePMContact({
        propertyDocId: property._id,
        ...form,
      });
      toast.success("PM contact information saved");
    } catch {
      toast.error("Failed to save PM contact information");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4 mt-2">
      <h3 className="font-medium">Property Management Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input
            value={form.pmCompanyName}
            onChange={(e) => update("pmCompanyName", e.target.value)}
            placeholder="PM company name"
          />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input
            value={form.pmWebsite}
            onChange={(e) => update("pmWebsite", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.pmEmail}
            onChange={(e) => update("pmEmail", e.target.value)}
            placeholder="contact@pm.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={form.pmPhone}
            onChange={(e) => update("pmPhone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label>Contact Name</Label>
          <Input
            value={form.pmContactName}
            onChange={(e) => update("pmContactName", e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label>Contact Title</Label>
          <Input
            value={form.pmContactTitle}
            onChange={(e) => update("pmContactTitle", e.target.value)}
            placeholder="e.g. Regional Manager"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={form.pmNotes}
          onChange={(e) => update("pmNotes", e.target.value)}
          placeholder="Additional notes about this property management company..."
          rows={3}
        />
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-1" />
        )}
        Save Contact Info
      </Button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// C. MARKET DATA SUMMARY SECTION
// ═════════════════════════════════════════════════════════════════════
function MarketDataSection({ propertyId }: { propertyId: string }) {
  const data = useQuery(api.multifamilyproperties.getPropertyWithMarketData, {
    propertyId,
  });

  if (data === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Property not found.
      </div>
    );
  }

  const { rentData, occupancyData, concessionData } = data;
  const hasData =
    rentData.length > 0 ||
    occupancyData.length > 0 ||
    concessionData.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed mt-2">
        <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
        No market data available for this property. Use the Market Data Upload
        tab to add data.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      {/* Rent Data */}
      {rentData.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">
            Rent Data ({rentData.length} months)
          </h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">
                  ${Math.round(rentData.reduce((s: number, r: RentRecord) => s + r.averageRent, 0) / rentData.length).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Avg Rent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">
                  ${Math.min(...rentData.map((r: RentRecord) => r.minRent)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Min Rent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">
                  ${Math.max(...rentData.map((r: RentRecord) => r.maxRent)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Max Rent</p>
              </CardContent>
            </Card>
          </div>
          <div className="border rounded-lg overflow-auto max-h-[200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Avg Rent</TableHead>
                  <TableHead className="text-right">$/SqFt</TableHead>
                  <TableHead className="text-right">Units Rented</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentData.map((r: RentRecord) => (
                  <TableRow key={r._id}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell className="text-right">
                      ${r.averageRent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${r.rentPerSqFt.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.unitsRented}/{r.totalUnits}
                    </TableCell>
                    <TableCell className="text-right">
                      ${r.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Occupancy Data */}
      {occupancyData.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">
            Occupancy Data ({occupancyData.length} months)
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">
                  {(occupancyData.reduce((s: number, o: OccupancyRecord) => s + o.occupancyRate, 0) / occupancyData.length).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Occupancy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">
                  {occupancyData[0]?.totalUnits ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Units</p>
              </CardContent>
            </Card>
          </div>
          <div className="border rounded-lg overflow-auto max-h-[200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Occupied</TableHead>
                  <TableHead className="text-right">Vacant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupancyData.map((o: OccupancyRecord) => (
                  <TableRow key={o._id}>
                    <TableCell>{o.month}</TableCell>
                    <TableCell className="text-right">
                      {o.occupancyRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {o.occupiedUnits}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.vacantUnits}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Concession Data */}
      {concessionData.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">
            Concession Data ({concessionData.length} records)
          </h4>
          <div className="border rounded-lg overflow-auto max-h-[200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Duration (mo)</TableHead>
                  <TableHead className="text-right">Units w/ Concessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concessionData.map((c: ConcessionRecord) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.month}</TableCell>
                    <TableCell>{c.concessionType}</TableCell>
                    <TableCell className="text-right">
                      ${c.concessionAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.concessionDuration}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.unitsWithConcessions}/{c.totalUnits}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MARKET DATA UPLOAD TAB
// ═════════════════════════════════════════════════════════════════════
interface UploadSection {
  type: "rent" | "occupancy" | "concessions";
  label: string;
  headers: string[];
  data: Record<string, unknown>[];
  errors: string[];
  isValid: boolean;
  isUploading: boolean;
  uploaded: boolean;
}

function MarketDataUploadTab() {
  const bulkUploadRent = useMutation(api.monthly_data.bulkUploadRent);
  const bulkUploadOccupancy = useMutation(
    api.monthly_data.bulkUploadOccupancy
  );
  const bulkUploadConcessions = useMutation(
    api.monthly_data.bulkUploadConcessions
  );

  const [sections, setSections] = useState<UploadSection[]>([
    {
      type: "rent",
      label: "Rent Data",
      headers: [
        "propertyId",
        "month",
        "averageRent",
        "minRent",
        "maxRent",
        "rentPerSqFt",
        "totalRevenue",
        "unitsRented",
        "totalUnits",
      ],
      data: [],
      errors: [],
      isValid: false,
      isUploading: false,
      uploaded: false,
    },
    {
      type: "occupancy",
      label: "Occupancy Data",
      headers: [
        "propertyId",
        "month",
        "occupancyRate",
        "occupiedUnits",
        "vacantUnits",
        "totalUnits",
      ],
      data: [],
      errors: [],
      isValid: false,
      isUploading: false,
      uploaded: false,
    },
    {
      type: "concessions",
      label: "Concession Data",
      headers: [
        "propertyId",
        "month",
        "concessionType",
        "concessionAmount",
        "concessionDuration",
        "unitsWithConcessions",
        "totalUnits",
      ],
      data: [],
      errors: [],
      isValid: false,
      isUploading: false,
      uploaded: false,
    },
  ]);

  const parseFile = (
    file: File,
    sectionIndex: number,
    expectedHeaders: string[]
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<
          string,
          unknown
        >[];

        if (jsonData.length === 0) {
          updateSection(sectionIndex, {
            data: [],
            errors: ["File is empty"],
            isValid: false,
          });
          return;
        }

        // Validate that the first row has the expected column headers (case-insensitive)
        const fileHeaders = Object.keys(jsonData[0]).map((h) =>
          h.toLowerCase().replace(/[\s_]/g, "")
        );
        const missingHeaders = expectedHeaders.filter(
          (h) =>
            !fileHeaders.some((fh) =>
              fh.includes(h.toLowerCase().replace(/[\s_]/g, ""))
            )
        );

        const errors: string[] = [];
        if (missingHeaders.length > 0) {
          errors.push(`Missing columns: ${missingHeaders.join(", ")}`);
        }

        // Map data to expected shape
        const mappedData = jsonData.map((row) => {
          const mapped: Record<string, unknown> = {};
          for (const header of expectedHeaders) {
            const headerLower = header.toLowerCase().replace(/[\s_]/g, "");
            // Find matching key in the row
            const matchKey = Object.keys(row).find(
              (k) =>
                k.toLowerCase().replace(/[\s_]/g, "") === headerLower
            );
            if (matchKey) {
              const val = row[matchKey];
              // Convert numeric fields
              if (header !== "propertyId" && header !== "month" && header !== "concessionType") {
                mapped[header] = typeof val === "number" ? val : parseFloat(String(val)) || 0;
              } else {
                mapped[header] = String(val || "");
              }
            }
          }
          return mapped;
        });

        // Validate rows
        mappedData.forEach((row, i) => {
          if (!row.propertyId)
            errors.push(`Row ${i + 1}: Missing propertyId`);
          if (!row.month)
            errors.push(`Row ${i + 1}: Missing month`);
        });

        updateSection(sectionIndex, {
          data: mappedData,
          errors,
          isValid: errors.length === 0 && mappedData.length > 0,
        });
      } catch {
        updateSection(sectionIndex, {
          data: [],
          errors: ["Failed to parse Excel file"],
          isValid: false,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateSection = (index: number, updates: Partial<UploadSection>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const handleUpload = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section.isValid || section.data.length === 0) return;

    updateSection(sectionIndex, { isUploading: true });

    try {
      if (section.type === "rent") {
        await bulkUploadRent({ data: section.data as any });
      } else if (section.type === "occupancy") {
        await bulkUploadOccupancy({ data: section.data as any });
      } else {
        await bulkUploadConcessions({ data: section.data as any });
      }
      updateSection(sectionIndex, {
        isUploading: false,
        uploaded: true,
      });
      toast.success(
        `${section.label}: ${section.data.length} records uploaded`
      );
    } catch {
      updateSection(sectionIndex, { isUploading: false });
      toast.error(`Failed to upload ${section.label}`);
    }
  };

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Card key={section.type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              {section.label}
              {section.uploaded && (
                <Badge variant="default" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expected headers */}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Expected columns:</span>{" "}
              {section.headers.join(", ")}
            </div>

            {/* File picker */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                id={`upload-${section.type}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) parseFile(file, index, section.headers);
                  e.target.value = "";
                }}
                disabled={section.isUploading || section.uploaded}
              />
              <label
                htmlFor={`upload-${section.type}`}
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">
                  Click to select an XLSX file for{" "}
                  <strong>{section.label}</strong>
                </p>
              </label>
            </div>

            {/* Errors */}
            {section.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="font-medium text-red-400 mb-1 text-sm">
                  Validation Errors:
                </h4>
                <ul className="text-sm text-red-400/80 space-y-0.5">
                  {section.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>&#8226; {err}</li>
                  ))}
                  {section.errors.length > 10 && (
                    <li>
                      ...and {section.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview */}
            {section.data.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Preview: {section.data.length} rows parsed
                </p>
                <div className="border rounded-lg overflow-auto max-h-[180px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {section.headers.map((h) => (
                          <TableHead key={h} className="text-xs">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.data.slice(0, 5).map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {section.headers.map((h) => (
                            <TableCell key={h} className="text-xs">
                              {String(row[h] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {section.data.length > 5 && (
                        <TableRow>
                          <TableCell
                            colSpan={section.headers.length}
                            className="text-xs text-center text-muted-foreground"
                          >
                            ...and {section.data.length - 5} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Upload button */}
            {section.isValid && !section.uploaded && (
              <Button
                onClick={() => handleUpload(index)}
                disabled={section.isUploading}
                className="bg-green-600 hover:bg-green-500"
              >
                {section.isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload {section.data.length} Records
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab 3: Add Property ─────────────────────────────────────────────
function AddPropertyTab() {
  const createProperty = useMutation(api.multifamilyproperties.createProperty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    propertyName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    totalUnits: "",
    yearBuilt: "",
    averageUnitSize: "",
    pmCompanyName: "",
    pmEmail: "",
    pmPhone: "",
    pmContactName: "",
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyName || !form.address || !form.city || !form.state || !form.zipCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    const units = parseInt(form.totalUnits);
    const year = parseInt(form.yearBuilt);
    const size = parseInt(form.averageUnitSize);
    if (isNaN(units) || isNaN(year) || isNaN(size)) {
      toast.error("Units, year built, and unit size must be numbers");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProperty({
        propertyName: form.propertyName,
        address: form.address,
        city: form.city,
        state: form.state.toUpperCase(),
        zipCode: form.zipCode,
        totalUnits: units,
        yearBuilt: year,
        averageUnitSize: size,
        pmCompanyName: form.pmCompanyName || undefined,
        pmEmail: form.pmEmail || undefined,
        pmPhone: form.pmPhone || undefined,
        pmContactName: form.pmContactName || undefined,
      });
      toast.success(`Property created (ID: ${result.propertyId})`);
      setForm({
        propertyName: "", address: "", city: "", state: "", zipCode: "",
        totalUnits: "", yearBuilt: "", averageUnitSize: "",
        pmCompanyName: "", pmEmail: "", pmPhone: "", pmContactName: "",
      });
    } catch (err) {
      toast.error("Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Property
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manually add a property not in the national database.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Property Details (Required)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="propertyName">Property Name</Label>
                <Input
                  id="propertyName"
                  value={form.propertyName}
                  onChange={(e) => updateField("propertyName", e.target.value)}
                  placeholder="e.g. Sunset Ridge Apartments"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="e.g. 123 Main St"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g. Austin"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="e.g. TX"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="e.g. 78701"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="totalUnits">Total Units</Label>
                <Input
                  id="totalUnits"
                  type="number"
                  value={form.totalUnits}
                  onChange={(e) => updateField("totalUnits", e.target.value)}
                  placeholder="e.g. 120"
                  required
                />
              </div>
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={form.yearBuilt}
                  onChange={(e) => updateField("yearBuilt", e.target.value)}
                  placeholder="e.g. 2005"
                  required
                />
              </div>
              <div>
                <Label htmlFor="averageUnitSize">Avg Unit Size (sqft)</Label>
                <Input
                  id="averageUnitSize"
                  type="number"
                  value={form.averageUnitSize}
                  onChange={(e) => updateField("averageUnitSize", e.target.value)}
                  placeholder="e.g. 850"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional PM Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              PM Contact (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pmCompanyName">Company Name</Label>
                <Input
                  id="pmCompanyName"
                  value={form.pmCompanyName}
                  onChange={(e) => updateField("pmCompanyName", e.target.value)}
                  placeholder="e.g. Greystar"
                />
              </div>
              <div>
                <Label htmlFor="pmContactName">Contact Name</Label>
                <Input
                  id="pmContactName"
                  value={form.pmContactName}
                  onChange={(e) => updateField("pmContactName", e.target.value)}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="pmEmail">Email</Label>
                <Input
                  id="pmEmail"
                  type="email"
                  value={form.pmEmail}
                  onChange={(e) => updateField("pmEmail", e.target.value)}
                  placeholder="e.g. jane@greystar.com"
                />
              </div>
              <div>
                <Label htmlFor="pmPhone">Phone</Label>
                <Input
                  id="pmPhone"
                  type="tel"
                  value={form.pmPhone}
                  onChange={(e) => updateField("pmPhone", e.target.value)}
                  placeholder="e.g. (512) 555-0100"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Property
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

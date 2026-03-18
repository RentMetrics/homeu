"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Send,
  User,
  Home,
  Briefcase,
  Car,
  Users,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ApplicationPage() {
  const { user, isLoaded } = useUser();
  const userProfile = useQuery(
    api.users.getUserProfile,
    isLoaded && user ? { userId: user.id } : "skip"
  );
  const savedApp = useQuery(
    api.users.getSavedApplication,
    isLoaded && user ? { userId: user.id } : "skip"
  );
  const saveApplication = useMutation(api.users.saveApplication);

  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    ssn: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    unitNumber: "",
    monthlyRent: "",
    moveInDate: "",
    reasonForLeaving: "",
    usCitizen: "yes",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
  });

  const [employment, setEmployment] = useState({
    employer: "",
    position: "",
    income: "",
    startDate: "",
    supervisorName: "",
    supervisorPhone: "",
  });

  const [vehicles, setVehicles] = useState([
    { make: "", model: "", year: "", color: "", licensePlate: "", state: "" },
  ]);

  const [additionalNotes, setAdditionalNotes] = useState("");

  // Pre-fill from profile
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || userProfile.firstName || "",
        lastName: prev.lastName || userProfile.lastName || "",
        email: prev.email || userProfile.email || "",
        phone: prev.phone || userProfile.phoneNumber || "",
        dateOfBirth: prev.dateOfBirth || userProfile.dateOfBirth || "",
        street: prev.street || userProfile.street || "",
        city: prev.city || userProfile.city || "",
        state: prev.state || userProfile.state || "",
        zipCode: prev.zipCode || userProfile.zipCode || "",
      }));
      setEmployment((prev) => ({
        ...prev,
        employer: prev.employer || userProfile.employer || "",
        position: prev.position || userProfile.position || "",
        income: prev.income || (userProfile.income ? userProfile.income.toString() : ""),
      }));
    }
  }, [userProfile]);

  // Restore saved application
  useEffect(() => {
    if (savedApp?.formData) {
      const d = savedApp.formData;
      if (d.personal) setFormData((prev) => ({ ...prev, ...d.personal }));
      if (d.employment) setEmployment((prev) => ({ ...prev, ...d.employment }));
      if (d.additionalNotes) setAdditionalNotes(d.additionalNotes);
      setHasSaved(true);
    }
    if (savedApp?.vehicles && Array.isArray(savedApp.vehicles) && savedApp.vehicles.length > 0) {
      setVehicles(savedApp.vehicles);
    }
  }, [savedApp]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmploymentChange = (field: string, value: string) => {
    setEmployment((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehicleChange = (index: number, field: string, value: string) => {
    setVehicles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await saveApplication({
        userId: user.id,
        formData: { personal: formData, employment, additionalNotes },
        coApplicants: [],
        occupants: [],
        vehicles,
        incomeSources: [employment],
      });
      setHasSaved(true);
      toast.success("Application saved!");
    } catch (error) {
      toast.error("Failed to save application");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasSaved) {
      toast.error("Please save your application first.");
      return;
    }
    setIsSending(true);
    try {
      await saveApplication({
        userId: user!.id,
        formData: { personal: formData, employment, additionalNotes, submittedAt: Date.now() },
        coApplicants: [],
        occupants: [],
        vehicles,
        incomeSources: [employment],
      });
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit application");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="mb-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Rental Application</h1>
        <p className="text-gray-500 mt-1">Save first, then submit when ready.</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={formData.firstName} onChange={(e) => handleFormChange("firstName", e.target.value)} /></div>
            <div><Label>Last Name</Label><Input value={formData.lastName} onChange={(e) => handleFormChange("lastName", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input value={formData.email} disabled className="bg-gray-50" /></div>
            <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => handleFormChange("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Date of Birth</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => handleFormChange("dateOfBirth", e.target.value)} /></div>
            <div>
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleFormChange("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-Binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer Not to Say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>U.S. Citizen</Label>
              <Select value={formData.usCitizen} onValueChange={(v) => handleFormChange("usCitizen", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Current Residence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><Label>Street Address</Label><Input value={formData.street} onChange={(e) => handleFormChange("street", e.target.value)} /></div>
            <div><Label>Unit / Apt #</Label><Input value={formData.unitNumber} onChange={(e) => handleFormChange("unitNumber", e.target.value)} placeholder="e.g., 4B" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>City</Label><Input value={formData.city} onChange={(e) => handleFormChange("city", e.target.value)} /></div>
            <div><Label>State</Label><Input value={formData.state} onChange={(e) => handleFormChange("state", e.target.value)} maxLength={2} /></div>
            <div><Label>ZIP Code</Label><Input value={formData.zipCode} onChange={(e) => handleFormChange("zipCode", e.target.value)} maxLength={5} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Monthly Rent</Label><Input value={formData.monthlyRent} onChange={(e) => handleFormChange("monthlyRent", e.target.value)} placeholder="$1,500" /></div>
            <div><Label>Desired Move-In Date</Label><Input type="date" value={formData.moveInDate} onChange={(e) => handleFormChange("moveInDate", e.target.value)} /></div>
          </div>
          <div><Label>Reason for Leaving</Label><Input value={formData.reasonForLeaving} onChange={(e) => handleFormChange("reasonForLeaving", e.target.value)} placeholder="e.g., Relocating for work" /></div>
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Employment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Employer</Label><Input value={employment.employer} onChange={(e) => handleEmploymentChange("employer", e.target.value)} /></div>
            <div><Label>Position</Label><Input value={employment.position} onChange={(e) => handleEmploymentChange("position", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Annual Income</Label><Input value={employment.income} onChange={(e) => handleEmploymentChange("income", e.target.value)} placeholder="$75,000" /></div>
            <div><Label>Start Date</Label><Input type="date" value={employment.startDate} onChange={(e) => handleEmploymentChange("startDate", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Supervisor Name</Label><Input value={employment.supervisorName} onChange={(e) => handleEmploymentChange("supervisorName", e.target.value)} /></div>
            <div><Label>Supervisor Phone</Label><Input value={employment.supervisorPhone} onChange={(e) => handleEmploymentChange("supervisorPhone", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Information</CardTitle>
          <CardDescription>Optional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="grid grid-cols-3 gap-3">
              <Input placeholder="Make" value={vehicle.make} onChange={(e) => handleVehicleChange(index, "make", e.target.value)} />
              <Input placeholder="Model" value={vehicle.model} onChange={(e) => handleVehicleChange(index, "model", e.target.value)} />
              <Input placeholder="Year" value={vehicle.year} onChange={(e) => handleVehicleChange(index, "year", e.target.value)} />
              <Input placeholder="Color" value={vehicle.color} onChange={(e) => handleVehicleChange(index, "color", e.target.value)} />
              <Input placeholder="License Plate" value={vehicle.licensePlate} onChange={(e) => handleVehicleChange(index, "licensePlate", e.target.value)} />
              <Input placeholder="State" value={vehicle.state} onChange={(e) => handleVehicleChange(index, "state", e.target.value)} maxLength={2} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setVehicles([...vehicles, { make: "", model: "", year: "", color: "", licensePlate: "", state: "" }])}>
            + Add Vehicle
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Name</Label><Input value={formData.emergencyName} onChange={(e) => handleFormChange("emergencyName", e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={formData.emergencyPhone} onChange={(e) => handleFormChange("emergencyPhone", e.target.value)} /></div>
            <div><Label>Relationship</Label><Input value={formData.emergencyRelationship} onChange={(e) => handleFormChange("emergencyRelationship", e.target.value)} placeholder="e.g., Parent" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Pets, special requests, etc." rows={3} />
        </CardContent>
      </Card>

      {/* Actions — Save first, then Submit */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={isSaving} variant="outline" className="flex-1" size="lg">
          {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : hasSaved ? <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Saved — Update</> : <><Save className="h-4 w-4 mr-2" /> Save Application</>}
        </Button>
        <Button onClick={handleSubmit} disabled={isSending || !hasSaved} className="flex-1 bg-green-600 hover:bg-green-700" size="lg">
          {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4 mr-2" /> Submit Application</>}
        </Button>
      </div>
      {!hasSaved && <p className="text-center text-sm text-gray-500">Save your application first, then submit.</p>}
    </div>
  );
}

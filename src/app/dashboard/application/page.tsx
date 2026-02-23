"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useVerification } from '@/hooks/useVerification';
import { useUserSync } from '@/hooks/useUserSync';
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  User,
  Users,
  MapPin,
  Briefcase,
  DollarSign,
  CreditCard,
  Shield,
  Phone,
  Car,
  CheckCircle,
  Save,
  Send,
  Loader2
} from 'lucide-react';
import { GigIncomeConnect } from '@/components/argyle/GigIncomeConnect';
import { ArgyleLink, ArgyleLinkConnected } from '@/components/argyle/ArgyleLink';
import { SendApplicationModal } from '@/components/application/SendApplicationModal';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';

export default function MyApplicationPage() {
  const { user, userProfile } = useUserSync();
  const { verificationStatus } = useVerification();
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const savedApplication = useQuery(
    api.users.getSavedApplication,
    user?.id ? { userId: user.id } : "skip"
  );
  const saveApplicationMutation = useMutation(api.users.saveApplication);

  // Argyle verified income data
  const argyleStatus = useQuery(
    api.argyle.getArgyleStatus,
    user?.id ? { userId: user.id } : "skip"
  );

  // Dynamic fields state
  const [coApplicants, setCoApplicants] = useState<Array<{ [key: string]: string }>>([{ name: "", email: "" }]);
  const [occupants, setOccupants] = useState<Array<{ [key: string]: string }>>([{ name: "", relationship: "", birthdate: "", ssn: "", driverLicense: "", govId: "", state: "" }]);
  const [vehicles, setVehicles] = useState<Array<{ [key: string]: string }>>([{ make: "", model: "", color: "", year: "", license: "", state: "" }]);
  const [incomeSources, setIncomeSources] = useState<Array<{ [key: string]: string }>>([{ type: "", source: "", amount: "" }]);

  // Main form state
  const [form, setForm] = useState({
    fullName: "",
    formerName: "",
    gender: "",
    birthdate: "",
    ssn: "",
    state: "",
    driverLicense: "",
    govId: "",
    homePhone: "",
    workPhone: "",
    cellPhone: "",
    email: "",
    maritalStatus: "",
    isCitizen: false,
    isSmoker: false,
    applyingFor: "",
    hasCoApplicant: false,
  });

  // Pre-fill from saved application, or from profile/signup data
  useEffect(() => {
    // Still loading saved application
    if (savedApplication === undefined) return;

    if (savedApplication) {
      // Pre-fill from saved application (highest priority)
      if (savedApplication.formData) setForm(savedApplication.formData);
      if (savedApplication.coApplicants?.length) setCoApplicants(savedApplication.coApplicants);
      if (savedApplication.occupants?.length) setOccupants(savedApplication.occupants);
      if (savedApplication.vehicles?.length) setVehicles(savedApplication.vehicles);
      if (savedApplication.incomeSources?.length) setIncomeSources(savedApplication.incomeSources);
    } else if (userProfile || user) {
      // No saved application - pre-fill from signup/profile data
      setForm(prev => ({
        ...prev,
        fullName: (userProfile?.firstName && userProfile?.lastName
          ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
          : user?.fullName || prev.fullName),
        email: userProfile?.email || user?.emailAddresses?.[0]?.emailAddress || prev.email,
        cellPhone: userProfile?.phoneNumber || prev.cellPhone,
        birthdate: userProfile?.dateOfBirth || prev.birthdate,
        state: userProfile?.state || prev.state,
      }));
    }
  }, [savedApplication, userProfile, user]);

  const handleSendApplication = () => {
    if (!user?.id) {
      toast.error("You must be logged in to submit an application.");
      return;
    }
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Please fill in at least your full name and email.");
      return;
    }
    setShowSendModal(true);
  };

  const saveApplication = async () => {
    if (!user?.id) throw new Error("Not logged in");
    await saveApplicationMutation({
      userId: user.id,
      formData: form,
      coApplicants,
      occupants,
      vehicles,
      incomeSources,
    });
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to save.");
      return;
    }
    setIsSaving(true);
    try {
      await saveApplication();
      toast.success("Application draft saved!");
    } catch (error) {
      toast.error("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for dynamic fields
  const addCoApplicant = () => setCoApplicants([...coApplicants, { name: "", email: "" }]);
  const removeCoApplicant = (idx: number) => setCoApplicants(coApplicants.filter((_, i) => i !== idx));
  const addOccupant = () => setOccupants([...occupants, { name: "", relationship: "", birthdate: "", ssn: "", driverLicense: "", govId: "", state: "" }]);
  const removeOccupant = (idx: number) => setOccupants(occupants.filter((_, i) => i !== idx));
  const addVehicle = () => setVehicles([...vehicles, { make: "", model: "", color: "", year: "", license: "", state: "" }]);
  const removeVehicle = (idx: number) => setVehicles(vehicles.filter((_, i) => i !== idx));
  const addIncomeSource = () => setIncomeSources([...incomeSources, { type: "", source: "", amount: "" }]);
  const removeIncomeSource = (idx: number) => setIncomeSources(incomeSources.filter((_, i) => i !== idx));

  const handleCoApplicantChange = (idx: number, field: string, value: string) => {
    const updated = [...coApplicants];
    updated[idx][field] = value;
    setCoApplicants(updated);
  };
  const handleOccupantChange = (idx: number, field: string, value: string) => {
    const updated = [...occupants];
    updated[idx][field] = value;
    setOccupants(updated);
  };
  const handleVehicleChange = (idx: number, field: string, value: string) => {
    const updated = [...vehicles];
    updated[idx][field] = value;
    setVehicles(updated);
  };
  const handleIncomeSourceChange = (idx: number, field: string, value: string) => {
    const updated = [...incomeSources];
    updated[idx][field] = value;
    setIncomeSources(updated);
  };

  const handleFormChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Calculate completion progress
  const getSectionCompletion = () => {
    const aboutYou = [form.fullName, form.email, form.cellPhone, form.birthdate].filter(Boolean).length;
    const aboutYouTotal = 4;
    const hasAddress = false; // placeholder
    const hasWork = !!argyleStatus?.employmentVerified;
    const hasIncome = incomeSources.some(s => s.type && s.amount);

    const completed = (aboutYou >= aboutYouTotal ? 1 : 0) +
      (hasAddress ? 1 : 0) +
      (hasWork ? 1 : 0) +
      (hasIncome ? 1 : 0);

    return { completed, total: 7 };
  };

  const { completed, total } = getSectionCompletion();
  const progressPercent = Math.round((completed / total) * 100);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Application</h1>
            <p className="text-gray-500 text-sm mt-1">Complete your rental application to send to properties</p>
          </div>
          <div className="flex items-center gap-3">
            {verificationStatus.isVerified ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified Renter
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-200 text-orange-700">Unverified</Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Application Progress</span>
              <span className="text-sm font-bold text-blue-800">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              {completed} of {total} sections completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Sticky */}
      <div className="flex gap-3 mb-6">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex-1 sm:flex-none"
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
          onClick={handleSendApplication}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Application
        </Button>
      </div>

      {/* Application Form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Lease Application</CardTitle>
          <CardDescription>Fill out each section below. Your progress is saved automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["about-you"]} className="w-full">
            {/* ABOUT YOU */}
            <AccordionItem value="about-you" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">About You</span>
                    <p className="text-xs text-gray-500 font-normal">Personal information and identification</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Full Name *</Label>
                    <Input name="fullName" value={form.fullName} onChange={handleFormChange} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Former Name</Label>
                    <Input name="formerName" value={form.formerName} onChange={handleFormChange} placeholder="If applicable" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Gender</Label>
                    <Input name="gender" value={form.gender} onChange={handleFormChange} placeholder="Gender" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Date of Birth *</Label>
                    <Input name="birthdate" type="date" value={form.birthdate} onChange={handleFormChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Social Security #</Label>
                    <Input name="ssn" value={form.ssn} onChange={handleFormChange} placeholder="XXX-XX-XXXX" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">State</Label>
                    <Input name="state" value={form.state} onChange={handleFormChange} placeholder="State" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Driver License #</Label>
                    <Input name="driverLicense" value={form.driverLicense} onChange={handleFormChange} placeholder="License number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Government ID #</Label>
                    <Input name="govId" value={form.govId} onChange={handleFormChange} placeholder="ID number" />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Contact Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Cell Phone *</Label>
                      <Input name="cellPhone" value={form.cellPhone} onChange={handleFormChange} placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Email *</Label>
                      <Input name="email" value={form.email} onChange={handleFormChange} placeholder="you@email.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Home Phone</Label>
                      <Input name="homePhone" value={form.homePhone} onChange={handleFormChange} placeholder="Home phone" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Work Phone</Label>
                      <Input name="workPhone" value={form.workPhone} onChange={handleFormChange} placeholder="Work phone" />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Marital Status</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="maritalStatus" value="single" checked={form.maritalStatus === 'single'} onChange={handleFormChange} className="accent-blue-600" /> Single
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="maritalStatus" value="married" checked={form.maritalStatus === 'married'} onChange={handleFormChange} className="accent-blue-600" /> Married
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">U.S. Citizen?</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="isCitizen" value="yes" checked={form.isCitizen === true} onChange={() => setForm({ ...form, isCitizen: true })} className="accent-blue-600" /> Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="isCitizen" value="no" checked={form.isCitizen === false} onChange={() => setForm({ ...form, isCitizen: false })} className="accent-blue-600" /> No
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Smoker?</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="isSmoker" value="yes" checked={form.isSmoker === true} onChange={() => setForm({ ...form, isSmoker: true })} className="accent-blue-600" /> Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="isSmoker" value="no" checked={form.isSmoker === false} onChange={() => setForm({ ...form, isSmoker: false })} className="accent-blue-600" /> No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Co-applicants */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Co-applicants</span>
                      <Badge variant="secondary" className="text-xs">{coApplicants.length}</Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCoApplicant}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {coApplicants.map((c, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input value={c.name} placeholder="Name" onChange={e => handleCoApplicantChange(idx, "name", e.target.value)} />
                          <Input value={c.email} placeholder="Email" onChange={e => handleCoApplicantChange(idx, "email", e.target.value)} />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeCoApplicant(idx)} disabled={coApplicants.length === 1} className="shrink-0 h-8 w-8">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* OTHER OCCUPANTS */}
            <AccordionItem value="other-occupants" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Other Occupants</span>
                    <p className="text-xs text-gray-500 font-normal">People who will also live in the unit</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-3">
                  {occupants.map((o, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-gray-500">Occupant {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeOccupant(idx)} disabled={occupants.length === 1}>
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 mr-1" /> Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Full Name</Label>
                          <Input value={o.name} placeholder="Full name" onChange={e => handleOccupantChange(idx, "name", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Relationship</Label>
                          <Input value={o.relationship} placeholder="e.g., Spouse, Child" onChange={e => handleOccupantChange(idx, "relationship", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Date of Birth</Label>
                          <Input value={o.birthdate} type="date" onChange={e => handleOccupantChange(idx, "birthdate", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">SSN</Label>
                          <Input value={o.ssn} placeholder="XXX-XX-XXXX" onChange={e => handleOccupantChange(idx, "ssn", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOccupant}>
                    <Plus className="w-3 h-3 mr-1" /> Add Occupant
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* WHERE YOU LIVE */}
            <AccordionItem value="where-you-live" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Where You Live</span>
                    <p className="text-xs text-gray-500 font-normal">Current and previous address history</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Current Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs text-gray-600">Street Address</Label>
                        <Input placeholder="123 Main St, Apt 4B" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">City</Label>
                        <Input placeholder="City" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">State</Label>
                          <Input placeholder="State" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Zip</Label>
                          <Input placeholder="Zip" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Monthly Payment</Label>
                        <Input placeholder="$0.00" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Apartment/Complex Name</Label>
                        <Input placeholder="Community name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Owner/Manager Name</Label>
                        <Input placeholder="Contact name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Phone</Label>
                        <Input placeholder="Phone number" />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs text-gray-600">Reason for Leaving</Label>
                        <Input placeholder="Why are you moving?" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Address (if less than 5 years)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs text-gray-600">Street Address</Label>
                        <Input placeholder="Previous address" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">City</Label>
                        <Input placeholder="City" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">State</Label>
                          <Input placeholder="State" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Zip</Label>
                          <Input placeholder="Zip" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* YOUR WORK */}
            <AccordionItem value="your-work" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Your Work</span>
                    <p className="text-xs text-gray-500 font-normal">Employment verification and history</p>
                  </div>
                  {argyleStatus?.employmentVerified && (
                    <Badge className="bg-green-100 text-green-800 text-xs ml-auto mr-2">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                {/* Argyle Verified Employment */}
                {argyleStatus?.employmentVerified ? (
                  <div className="mb-6">
                    <ArgyleLinkConnected
                      employerName={argyleStatus.verifiedEmployer ?? undefined}
                      position={argyleStatus.verifiedPosition ?? undefined}
                      verificationDate={argyleStatus.employmentVerificationDate ?? undefined}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Employer (Verified)</Label>
                        <Input value={argyleStatus.verifiedEmployer || ""} readOnly className="bg-green-50 border-green-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Position (Verified)</Label>
                        <Input value={argyleStatus.verifiedPosition || ""} readOnly className="bg-green-50 border-green-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Gross Monthly Income (Verified)</Label>
                        <Input value={argyleStatus.verifiedIncome ? `$${argyleStatus.verifiedIncome.toLocaleString()}` : ""} readOnly className="bg-green-50 border-green-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Pay Frequency</Label>
                        <Input value={argyleStatus.verifiedPayFrequency || ""} readOnly className="bg-green-50 border-green-200" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <ArgyleLink onConnected={() => toast.success("Employment verified! Your work details have been auto-filled.")} />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    {argyleStatus?.employmentVerified ? "Additional Employment Details" : "Or enter manually"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Employer</Label>
                      <Input placeholder="Current employer" defaultValue={argyleStatus?.verifiedEmployer || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Position</Label>
                      <Input placeholder="Job title" defaultValue={argyleStatus?.verifiedPosition || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Gross Monthly Income</Label>
                      <Input placeholder="$0.00" defaultValue={argyleStatus?.verifiedIncome ? String(argyleStatus.verifiedIncome) : ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Start Date</Label>
                      <Input type="date" placeholder="Employment start date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Supervisor</Label>
                      <Input placeholder="Supervisor name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Supervisor Phone</Label>
                      <Input placeholder="Phone number" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ADDITIONAL INCOME */}
            <AccordionItem value="additional-income" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Additional Income</span>
                    <p className="text-xs text-gray-500 font-normal">Other income sources including gig work</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-3">
                  {incomeSources.map((inc, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input value={inc.type} placeholder="Type (e.g., Rental)" onChange={e => handleIncomeSourceChange(idx, "type", e.target.value)} />
                        <Input value={inc.source} placeholder="Source" onChange={e => handleIncomeSourceChange(idx, "source", e.target.value)} />
                        <Input value={inc.amount} placeholder="Monthly $" onChange={e => handleIncomeSourceChange(idx, "amount", e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeIncomeSource(idx)} disabled={incomeSources.length === 1} className="shrink-0 h-8 w-8">
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addIncomeSource}>
                    <Plus className="w-3 h-3 mr-1" /> Add Income Source
                  </Button>
                </div>

                {/* Gig Income Verification */}
                <div className="mt-6 pt-4 border-t">
                  <GigIncomeConnect />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* CREDIT HISTORY */}
            <AccordionItem value="credit-history" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Credit History</span>
                    <p className="text-xs text-gray-500 font-normal">Any past credit issues to disclose</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Explain any past credit problems</Label>
                  <Input placeholder="Describe any credit issues, or leave blank if none" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* RENTAL AND CRIMINAL HISTORY */}
            <AccordionItem value="rental-criminal-history" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Rental & Criminal History</span>
                    <p className="text-xs text-gray-500 font-normal">Background disclosures</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-3">
                  {[
                    "Been evicted or asked to move out?",
                    "Moved out before end of lease without owner's consent?",
                    "Declared bankruptcy?",
                    "Been sued for rent?",
                    "Been sued for property damage?",
                    "Convicted or received probation for a felony, sex crime, or any crime against persons or property?"
                  ].map((question, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox id={`history-${idx}`} className="mt-0.5" />
                      <label htmlFor={`history-${idx}`} className="text-sm text-gray-700 cursor-pointer leading-snug">{question}</label>
                    </div>
                  ))}
                  <div className="space-y-1.5 mt-4">
                    <Label className="text-xs text-gray-600">Additional Details</Label>
                    <Input placeholder="Year, location, type, details..." />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* EMERGENCY CONTACT */}
            <AccordionItem value="emergency-contact" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Emergency Contact</span>
                    <p className="text-xs text-gray-500 font-normal">Who to contact in case of emergency</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Relationship</Label>
                    <Input placeholder="e.g., Parent, Sibling" />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs text-gray-600">Address</Label>
                    <Input placeholder="Full address" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <Input placeholder="Phone number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input placeholder="Email address" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* YOUR VEHICLES */}
            <AccordionItem value="your-vehicles" className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Car className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">Your Vehicles</span>
                    <p className="text-xs text-gray-500 font-normal">Vehicles that will be on the property</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-3">
                  {vehicles.map((v, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-gray-500">Vehicle {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeVehicle(idx)} disabled={vehicles.length === 1}>
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 mr-1" /> Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Make</Label>
                          <Input value={v.make} placeholder="e.g., Toyota" onChange={e => handleVehicleChange(idx, "make", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Model</Label>
                          <Input value={v.model} placeholder="e.g., Camry" onChange={e => handleVehicleChange(idx, "model", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Year</Label>
                          <Input value={v.year} placeholder="e.g., 2022" onChange={e => handleVehicleChange(idx, "year", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Color</Label>
                          <Input value={v.color} placeholder="Color" onChange={e => handleVehicleChange(idx, "color", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">License Plate</Label>
                          <Input value={v.license} placeholder="License #" onChange={e => handleVehicleChange(idx, "license", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">State</Label>
                          <Input value={v.state} placeholder="State" onChange={e => handleVehicleChange(idx, "state", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addVehicle}>
                    <Plus className="w-3 h-3 mr-1" /> Add Vehicle
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex gap-3 mt-6 pb-8">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          onClick={handleSendApplication}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Application
        </Button>
      </div>

      {/* Send Application Modal */}
      <SendApplicationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSave={saveApplication}
        applicationId={savedApplication?._id}
      />
    </div>
  );
}

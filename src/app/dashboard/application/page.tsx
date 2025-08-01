"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import { useState } from "react";
import { Plus, Trash2 } from 'lucide-react';

export default function MyApplicationPage() {
  const { user } = useUser();
  const { verificationStatus } = useVerification();

  // Dynamic fields state
  const [coApplicants, setCoApplicants] = useState<Array<{ [key: string]: string }>>([{ name: "", email: "" }]);
  const [occupants, setOccupants] = useState<Array<{ [key: string]: string }>>([{ name: "", relationship: "", birthdate: "", ssn: "", driverLicense: "", govId: "", state: "" }]);
  const [vehicles, setVehicles] = useState<Array<{ [key: string]: string }>>([{ make: "", model: "", color: "", year: "", license: "", state: "" }]);
  const [incomeSources, setIncomeSources] = useState<Array<{ [key: string]: string }>>([{ type: "", source: "", amount: "" }]);

  // Main form state (simplified for scaffold)
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
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
    email: user?.emailAddresses?.[0]?.emailAddress || "",
    maritalStatus: "",
    isCitizen: false,
    isSmoker: false,
    applyingFor: "",
    hasCoApplicant: false,
    // ...other fields as needed
  });

  // Handlers for dynamic fields (add/remove and onChange)
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

  // Handler for main form fields
  const handleFormChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      {/* Top Bar with status and send button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Application</h1>
          {verificationStatus.isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800">HomeU Verified Renter</Badge>
          ) : (
            <Badge variant="outline" className="border-orange-200 text-orange-700">Unverified</Badge>
          )}
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Send Application</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Application</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* ABOUT YOU */}
            <AccordionItem value="about-you">
              <AccordionTrigger>About You</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <Input name="fullName" value={form.fullName} onChange={handleFormChange} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Former name (if applicable)</label>
                    <Input name="formerName" value={form.formerName} onChange={handleFormChange} placeholder="Former name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <Input name="gender" value={form.gender} onChange={handleFormChange} placeholder="Gender" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Birthdate</label>
                    <Input name="birthdate" value={form.birthdate} onChange={handleFormChange} placeholder="Birthdate" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Social Security #</label>
                    <Input name="ssn" value={form.ssn} onChange={handleFormChange} placeholder="Social Security #" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <Input name="state" value={form.state} onChange={handleFormChange} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Driver license #</label>
                    <Input name="driverLicense" value={form.driverLicense} onChange={handleFormChange} placeholder="Driver license #" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Government ID #</label>
                    <Input name="govId" value={form.govId} onChange={handleFormChange} placeholder="Government ID #" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Home phone</label>
                    <Input name="homePhone" value={form.homePhone} onChange={handleFormChange} placeholder="Home phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Work phone</label>
                    <Input name="workPhone" value={form.workPhone} onChange={handleFormChange} placeholder="Work phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cell phone</label>
                    <Input name="cellPhone" value={form.cellPhone} onChange={handleFormChange} placeholder="Cell phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email address</label>
                    <Input name="email" value={form.email} onChange={handleFormChange} placeholder="Email address" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Marital status</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1"><input type="radio" name="maritalStatus" value="single" checked={form.maritalStatus === 'single'} onChange={handleFormChange} /> Single</label>
                      <label className="flex items-center gap-1"><input type="radio" name="maritalStatus" value="married" checked={form.maritalStatus === 'married'} onChange={handleFormChange} /> Married</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">U.S. citizen?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1"><input type="radio" name="isCitizen" value="yes" checked={form.isCitizen === true} onChange={() => setForm({ ...form, isCitizen: true })} /> Yes</label>
                      <label className="flex items-center gap-1"><input type="radio" name="isCitizen" value="no" checked={form.isCitizen === false} onChange={() => setForm({ ...form, isCitizen: false })} /> No</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Do you or any occupant smoke?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1"><input type="radio" name="isSmoker" value="yes" checked={form.isSmoker === true} onChange={() => setForm({ ...form, isSmoker: true })} /> Yes</label>
                      <label className="flex items-center gap-1"><input type="radio" name="isSmoker" value="no" checked={form.isSmoker === false} onChange={() => setForm({ ...form, isSmoker: false })} /> No</label>
                    </div>
                  </div>
                </div>
                {/* Co-applicants dynamic fields */}
                <div className="mt-6">
                  <div className="font-semibold mb-2 flex items-center gap-2">Co-applicants <span className="text-xs text-gray-500">({coApplicants.length})</span></div>
                  {coApplicants.map((c, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 bg-gray-50 border rounded p-2 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Name</label>
                        <Input value={c.name} placeholder="Co-applicant name" className="w-full" onChange={e => handleCoApplicantChange(idx, "name", e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Email</label>
                        <Input value={c.email} placeholder="Email" className="w-full" onChange={e => handleCoApplicantChange(idx, "email", e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeCoApplicant(idx)} disabled={coApplicants.length === 1}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2 flex items-center gap-1" onClick={addCoApplicant}><Plus className="w-4 h-4" /> Add Co-applicant</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* OTHER OCCUPANTS */}
            <AccordionItem value="other-occupants">
              <AccordionTrigger>Other Occupants</AccordionTrigger>
              <AccordionContent>
                {occupants.map((o, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input value={o.name} placeholder="Full name" className="flex-1" onChange={e => handleOccupantChange(idx, "name", e.target.value)} />
                      <Input value={o.relationship} placeholder="Relationship" className="flex-1" onChange={e => handleOccupantChange(idx, "relationship", e.target.value)} />
                      <Input value={o.birthdate} placeholder="Birthdate" className="flex-1" onChange={e => handleOccupantChange(idx, "birthdate", e.target.value)} />
                      <Input value={o.ssn} placeholder="Social Security #" className="flex-1" onChange={e => handleOccupantChange(idx, "ssn", e.target.value)} />
                      <Input value={o.driverLicense} placeholder="Driver license #" className="flex-1" onChange={e => handleOccupantChange(idx, "driverLicense", e.target.value)} />
                      <Input value={o.govId} placeholder="Government ID #" className="flex-1" onChange={e => handleOccupantChange(idx, "govId", e.target.value)} />
                      <Input value={o.state} placeholder="State" className="flex-1" onChange={e => handleOccupantChange(idx, "state", e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={() => removeOccupant(idx)} disabled={occupants.length === 1}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addOccupant}>Add Occupant</Button>
              </AccordionContent>
            </AccordionItem>

            {/* WHERE YOU LIVE */}
            <AccordionItem value="where-you-live">
              <AccordionTrigger>Where You Live</AccordionTrigger>
              <AccordionContent>
                {/* Current and previous address fields, rent/own, etc. */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Current home address" />
                  <Input placeholder="City" />
                  <Input placeholder="State" />
                  <Input placeholder="Zip" />
                  <Input placeholder="Monthly payment" />
                  <Input placeholder="Apartment name" />
                  <Input placeholder="Owner/manager name" />
                  <Input placeholder="Phone" />
                  <Input placeholder="Reason for leaving" />
                </div>
                {/* Previous address fields (if <5 years) */}
                <div className="mt-4">
                  <div className="font-semibold mb-2">Previous Address (if less than 5 years)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Previous home address" />
                    <Input placeholder="City" />
                    <Input placeholder="State" />
                    <Input placeholder="Zip" />
                    <Input placeholder="Monthly payment" />
                    <Input placeholder="Apartment name" />
                    <Input placeholder="Owner/manager name" />
                    <Input placeholder="Phone" />
                    <Input placeholder="Reason for leaving" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* YOUR WORK */}
            <AccordionItem value="your-work">
              <AccordionTrigger>Your Work</AccordionTrigger>
              <AccordionContent>
                {/* Current employer fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Current employer" />
                  <Input placeholder="Address" />
                  <Input placeholder="City" />
                  <Input placeholder="State" />
                  <Input placeholder="Zip" />
                  <Input placeholder="Work phone" />
                  <Input placeholder="Beginning date of employment" />
                  <Input placeholder="Gross monthly income" />
                  <Input placeholder="Position" />
                  <Input placeholder="Supervisor" />
                  <Input placeholder="Supervisor phone" />
                </div>
                {/* Previous employer fields (if <5 years) */}
                <div className="mt-4">
                  <div className="font-semibold mb-2">Previous Employer (if less than 5 years)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Previous employer" />
                    <Input placeholder="Address" />
                    <Input placeholder="City" />
                    <Input placeholder="State" />
                    <Input placeholder="Zip" />
                    <Input placeholder="Work phone" />
                    <Input placeholder="Dates (from-to)" />
                    <Input placeholder="Gross monthly income" />
                    <Input placeholder="Position" />
                    <Input placeholder="Supervisor" />
                    <Input placeholder="Supervisor phone" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ADDITIONAL INCOME */}
            <AccordionItem value="additional-income">
              <AccordionTrigger>Additional Income</AccordionTrigger>
              <AccordionContent>
                {incomeSources.map((inc, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input value={inc.type} placeholder="Type" className="flex-1" onChange={e => handleIncomeSourceChange(idx, "type", e.target.value)} />
                    <Input value={inc.source} placeholder="Source" className="flex-1" onChange={e => handleIncomeSourceChange(idx, "source", e.target.value)} />
                    <Input value={inc.amount} placeholder="Gross monthly amount" className="flex-1" onChange={e => handleIncomeSourceChange(idx, "amount", e.target.value)} />
                    <Button variant="outline" onClick={() => removeIncomeSource(idx)} disabled={incomeSources.length === 1}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addIncomeSource}>Add Income Source</Button>
              </AccordionContent>
            </AccordionItem>

            {/* CREDIT HISTORY */}
            <AccordionItem value="credit-history">
              <AccordionTrigger>Credit History</AccordionTrigger>
              <AccordionContent>
                <Input placeholder="Explain any past credit problem" />
              </AccordionContent>
            </AccordionItem>

            {/* RENTAL AND CRIMINAL HISTORY */}
            <AccordionItem value="rental-criminal-history">
              <AccordionTrigger>Rental and Criminal History</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Been evicted or asked to move out?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Moved out before end of lease term without owner's consent?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Declared bankruptcy?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Been sued for rent?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Been sued for property damage?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox /> <span>Been convicted or received probation for a felony, sex crime, or any crime against persons or property?</span>
                  </div>
                  <Input placeholder="Details (year, location, type, etc.)" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* EMERGENCY CONTACT */}
            <AccordionItem value="emergency-contact">
              <AccordionTrigger>Emergency Contact</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Name" />
                  <Input placeholder="Relationship" />
                  <Input placeholder="Address" />
                  <Input placeholder="City" />
                  <Input placeholder="State" />
                  <Input placeholder="Zip" />
                  <Input placeholder="Home phone" />
                  <Input placeholder="Work phone" />
                  <Input placeholder="Cell phone" />
                  <Input placeholder="Email address" />
                </div>
                {/* Checkboxes for who can access property (not implemented in scaffold) */}
              </AccordionContent>
            </AccordionItem>

            {/* YOUR VEHICLES */}
            <AccordionItem value="your-vehicles">
              <AccordionTrigger>Your Vehicles</AccordionTrigger>
              <AccordionContent>
                {vehicles.map((v, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input value={v.make} placeholder="Make" className="flex-1" onChange={e => handleVehicleChange(idx, "make", e.target.value)} />
                      <Input value={v.model} placeholder="Model" className="flex-1" onChange={e => handleVehicleChange(idx, "model", e.target.value)} />
                      <Input value={v.color} placeholder="Color" className="flex-1" onChange={e => handleVehicleChange(idx, "color", e.target.value)} />
                      <Input value={v.year} placeholder="Year" className="flex-1" onChange={e => handleVehicleChange(idx, "year", e.target.value)} />
                      <Input value={v.license} placeholder="License #" className="flex-1" onChange={e => handleVehicleChange(idx, "license", e.target.value)} />
                      <Input value={v.state} placeholder="State" className="flex-1" onChange={e => handleVehicleChange(idx, "state", e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={() => removeVehicle(idx)} disabled={vehicles.length === 1}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addVehicle}>Add Vehicle</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
} 
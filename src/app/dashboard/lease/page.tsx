"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from '@clerk/nextjs';
import { RenewalStrategyPanel } from "@/components/market/RenewalStrategyPanel";

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

export default function LeasePage() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Convex hooks
  const generateUploadUrl = useMutation(api.leases.generateUploadUrl);
  const saveLeaseMetadata = useMutation(api.leases.saveLeaseMetadata);
  const processLeaseWithGemini = useAction(api.leases.processLeaseWithGemini);
  const leases = useQuery(api.leases.getLeasesByUser, user?.id ? { userId: user.id } : "skip");

  // Find the most recent lease (for abstract/highlights)
  const latestLease = leases && leases.length > 0 ? leases[leases.length - 1] : null;

  // Fetch user's renter profile for location-based market data
  const renterProfile = useQuery(api.renters.getByUserId, user?.id ? { userId: user.id } : "skip");
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const cityMarketStats = useQuery(
    api.marketStats.getMarketStats,
    renterProfile?.city && renterProfile?.state
      ? { city: renterProfile.city, state: renterProfile.state, month: currentMonth }
      : "skip"
  );
  const stateMarketStats = useQuery(
    api.marketStats.getStateMarketStats,
    renterProfile?.state && !cityMarketStats
      ? { state: renterProfile.state, month: currentMonth }
      : "skip"
  );
  const marketStats = cityMarketStats ?? stateMarketStats ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setSuccessMsg(null);
    setUploadError(null);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;
    setIsUploading(true);
    setUploadError(null);
    setSuccessMsg(null);
    try {
      const { url } = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("File upload failed");
      const { storageId } = await res.json();
      // Save lease metadata and get leaseId
      const leaseId = await saveLeaseMetadata({
        userId: user.id,
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
        uploadedAt: Date.now(),
      });
      setSuccessMsg("Lease uploaded! Processing for highlights...");
      // Trigger Gemini processing
      await processLeaseWithGemini({ leaseId });
      setSuccessMsg("Lease uploaded and processed! Abstract will appear soon.");
      setFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Manage Your Lease</h1>
        <p className="text-muted-foreground">Upload your lease and view a summary and highlights.</p>
      </div>

      {/* Lease Dashboard */}
      {latestLease ? (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                <p className="text-xl font-bold text-green-700">
                  {latestLease.rentalAmount || "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Lease Term</p>
                <p className="text-xl font-bold text-blue-700">
                  {latestLease.term || "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-xl font-bold text-purple-700">
                  {latestLease.status === "complete" ? "Active" : "Processing"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Uploaded</p>
                <p className="text-sm font-bold text-gray-700">
                  {new Date(latestLease.uploadedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Abstract */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Lease Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 text-base leading-relaxed">
                {latestLease.abstract ? (
                  <>{latestLease.abstract}</>
                ) : (
                  <span className="italic text-gray-400">
                    Processing your lease... The AI summary will appear here shortly.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No lease uploaded yet. Upload your lease below to see a detailed dashboard.</p>
          </CardContent>
        </Card>
      )}

      {/* Renewal Strategy (shown when lease has rental amount) */}
      {latestLease?.rentalAmount && (() => {
        const rentAmount = parseFloat(latestLease.rentalAmount.replace(/[^0-9.]/g, ''));
        if (isNaN(rentAmount) || rentAmount <= 0) return null;
        // Estimate lease end month ~12 months from upload
        const uploadDate = new Date(latestLease.uploadedAt);
        const leaseEndMonth = ((uploadDate.getMonth() + 12) % 12) + 1;
        return (
          <RenewalStrategyPanel
            currentRent={rentAmount}
            marketRent={marketStats?.avgRent ?? rentAmount}
            occupancyRate={marketStats?.avgOccupancy ?? 90}
            tenureTenureMonths={12}
            onTimePaymentRate={95}
            rentTrend3mo={marketStats?.rentTrend3mo ?? 0}
            concessionValue={marketStats?.avgConcessionValue ?? 0}
            leaseEndMonth={leaseEndMonth}
          />
        );
      })()}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Lease Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
            />
            {previewUrl && (
              <div className="mt-4">
                <span className="block text-xs text-gray-500 mb-2">Preview:</span>
                {file?.type === "application/pdf" ? (
                  <embed src={previewUrl} width="100%" height="400px" type="application/pdf" />
                ) : (
                  <img src={previewUrl} alt="Lease Preview" className="max-h-64 rounded border" />
                )}
              </div>
            )}
          </div>
          <Button onClick={handleUpload} disabled={!file || isUploading || !user?.id} className="w-full">
            {isUploading ? "Uploading..." : "Upload Lease"}
          </Button>
          {uploadError && <div className="text-red-600 mt-2">{uploadError}</div>}
          {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
        </CardContent>
      </Card>

      {/* Uploaded Leases List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Leases</CardTitle>
        </CardHeader>
        <CardContent>
          {!leases ? (
            <div>Loading...</div>
          ) : leases.length === 0 ? (
            <div className="text-gray-500">No leases uploaded yet.</div>
          ) : (
            <ul className="space-y-2">
              {leases.map((lease: any) => (
                <li key={lease._id} className="border rounded p-2">
                  <div className="font-medium">{lease.fileName}</div>
                  <div className="text-xs text-gray-500">Uploaded: {new Date(lease.uploadedAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Status: {lease.status}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
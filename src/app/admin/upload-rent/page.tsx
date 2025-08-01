"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface RentData {
  propertyId: string;
  month: string;
  averageRent: number;
  minRent: number;
  maxRent: number;
  rentPerSqFt: number;
  totalRevenue: number;
  unitsRented: number;
  totalUnits: number;
}

export default function UploadRentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<RentData[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const bulkUploadRent = useMutation(api.monthly_data.bulkUploadRent);
  const allPropertyIds = useQuery(api.monthly_data.getAllPropertyIds);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        const headers = jsonData[0] as string[];
        
        // Validate headers
        const expectedHeaders = [
          'property id',
          'month',
          'average rent',
          'min rent',
          'max rent',
          'rent per sq ft',
          'total revenue',
          'units rented',
          'total units'
        ];

        const isValidHeaders = expectedHeaders.every(header =>
          headers.some(h => h && h.toLowerCase().includes(header.toLowerCase()))
        );

        if (!isValidHeaders) {
          toast.error("Invalid Excel format. Please check the headers.");
          return;
        }

        const previewDataArray: RentData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < Math.min(jsonData.length, 6); i++) { // Preview first 5 rows
          const row = jsonData[i] as any[];
          if (row && row.length >= 9) {
            const data = {
              propertyId: String(row[0] || ''),
              month: String(row[1] || ''),
              averageRent: parseFloat(row[2]) || 0,
              minRent: parseFloat(row[3]) || 0,
              maxRent: parseFloat(row[4]) || 0,
              rentPerSqFt: parseFloat(row[5]) || 0,
              totalRevenue: parseFloat(row[6]) || 0,
              unitsRented: parseInt(row[7]) || 0,
              totalUnits: parseInt(row[8]) || 0,
            };

            // Validate data
            if (!data.propertyId) {
              errors.push(`Row ${i + 1}: Missing property ID`);
            }
            if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
              errors.push(`Row ${i + 1}: Invalid month format (should be YYYY-MM)`);
            }
            if (data.averageRent < 0) {
              errors.push(`Row ${i + 1}: Average rent cannot be negative`);
            }
            if (data.minRent > data.maxRent) {
              errors.push(`Row ${i + 1}: Min rent cannot be greater than max rent`);
            }

            previewDataArray.push(data);
          }
        }

        setPreviewData(previewDataArray);
        setValidationErrors(errors);
      } catch (error) {
        toast.error("Error parsing Excel file. Please check the format.");
        console.error("Excel parsing error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file || !allPropertyIds) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const data: RentData[] = [];
      const errors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row && row.length >= 9 && row[0]) {
          const record = {
            propertyId: String(row[0] || ''),
            month: String(row[1] || ''),
            averageRent: parseFloat(row[2]) || 0,
            minRent: parseFloat(row[3]) || 0,
            maxRent: parseFloat(row[4]) || 0,
            rentPerSqFt: parseFloat(row[5]) || 0,
            totalRevenue: parseFloat(row[6]) || 0,
            unitsRented: parseInt(row[7]) || 0,
            totalUnits: parseInt(row[8]) || 0,
          };

          // Validate property ID exists
          if (!allPropertyIds.includes(record.propertyId)) {
            errors.push(`Row ${i + 1}: Property ID "${record.propertyId}" not found in database`);
          }

          // Validate month format
          if (!/^\d{4}-\d{2}$/.test(record.month)) {
            errors.push(`Row ${i + 1}: Invalid month format "${record.month}" (should be YYYY-MM)`);
          }

          // Validate rent values
          if (record.averageRent < 0) {
            errors.push(`Row ${i + 1}: Average rent ${record.averageRent} cannot be negative`);
          }
          if (record.minRent > record.maxRent) {
            errors.push(`Row ${i + 1}: Min rent ${record.minRent} cannot be greater than max rent ${record.maxRent}`);
          }

          data.push(record);
        }
        setUploadProgress((i / jsonData.length) * 100);
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`${errors.length} validation errors found. Please fix and try again.`);
        return;
      }

      await bulkUploadRent({ data });
      setUploadedCount(data.length);
      toast.success(`Successfully uploaded ${data.length} rent records!`);
      
      // Reset form
      setFile(null);
      setPreviewData([]);
      setUploadProgress(0);
      setValidationErrors([]);
    } catch (error) {
      toast.error("Failed to upload rent data. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Rent Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload monthly rent data for existing properties.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Upload Excel File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <FileText className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {file ? file.name : "Click to select Excel file"}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? "File selected" : "or drag and drop (.xlsx, .xls)"}
                </p>
              </div>
            </label>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">File Preview (First 5 rows)</h3>
                <div className="text-sm text-gray-500">
                  Total records to upload: {previewData.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Property ID
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Month
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Avg Rent
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Min Rent
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Max Rent
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Rent/Sq Ft
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Revenue
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                        Units
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((record, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {record.propertyId}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {record.month}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          ${record.averageRent.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          ${record.minRent.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          ${record.maxRent.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          ${record.rentPerSqFt.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          ${record.totalRevenue.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {record.unitsRented}/{record.totalUnits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || validationErrors.length > 0}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Rent Data
                    </>
                  )}
                </Button>

                {isUploading && (
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round(uploadProgress)}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Excel Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Required Headers:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• property id</li>
                  <li>• month</li>
                  <li>• average rent</li>
                  <li>• min rent</li>
                  <li>• max rent</li>
                  <li>• rent per sq ft</li>
                  <li>• total revenue</li>
                  <li>• units rented</li>
                  <li>• total units</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Row:</h4>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  PROP001 | 2024-01 | 2500 | 2200 | 2800 | 2.50 | 475000 | 190 | 200
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Property IDs must exist in the properties database</li>
                <li>• Month format must be YYYY-MM (e.g., 2024-01)</li>
                <li>• All rent amounts should be in dollars</li>
                <li>• Rent per sq ft should be in dollars per square foot</li>
                <li>• Min rent should not exceed max rent</li>
                <li>• All numeric fields must be valid numbers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
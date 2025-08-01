"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Loader2, Users, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

interface OccupancyData {
  propertyId: string;
  month: string;
  occupancyRate: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalUnits: number;
}

interface FileData {
  file: File;
  data: OccupancyData[];
  errors: string[];
  isValid: boolean;
  uploadProgress: number;
  isUploading: boolean;
}

export default function UploadOccupancyPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  
  const bulkUploadOccupancy = useMutation(api.monthly_data.bulkUploadOccupancy);
  const allPropertyIds = useQuery(api.monthly_data.getAllPropertyIds);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: FileData[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Check if file is already in the list
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast.error(`File "${file.name}" is already selected`);
        return;
      }

      const fileData: FileData = {
        file,
        data: [],
        errors: [],
        isValid: false,
        uploadProgress: 0,
        isUploading: false
      };

      parseExcel(file, fileData);
      newFiles.push(fileData);
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // Clear the input
    event.target.value = '';
  };

  const parseExcel = (file: File, fileData: FileData) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileDataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileDataBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          fileData.errors.push("Excel file is empty");
          setFiles(prev => [...prev]);
          return;
        }

        const headers = jsonData[0] as string[];
        
        // Validate headers
        const expectedHeaders = [
          'property id',
          'month',
          'occupancy rate',
          'occupied units',
          'vacant units',
          'total units'
        ];

        const isValidHeaders = expectedHeaders.every(header =>
          headers.some(h => h && h.toLowerCase().includes(header.toLowerCase()))
        );

        if (!isValidHeaders) {
          fileData.errors.push("Invalid Excel format. Please check the headers.");
          setFiles(prev => [...prev]);
          return;
        }

        const data: OccupancyData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 6 && row[0]) {
            const record = {
              propertyId: String(row[0] || ''),
              month: String(row[1] || ''),
              occupancyRate: parseFloat(row[2]) || 0,
              occupiedUnits: parseInt(row[3]) || 0,
              vacantUnits: parseInt(row[4]) || 0,
              totalUnits: parseInt(row[5]) || 0,
            };

            // Validate data
            if (!record.propertyId) {
              errors.push(`Row ${i + 1}: Missing property ID`);
            }
            if (!record.month || !/^\d{4}-\d{2}$/.test(record.month)) {
              errors.push(`Row ${i + 1}: Invalid month format (should be YYYY-MM)`);
            }
            if (record.occupancyRate < 0 || record.occupancyRate > 100) {
              errors.push(`Row ${i + 1}: Occupancy rate must be between 0-100`);
            }

            data.push(record);
          }
        }

        fileData.data = data;
        fileData.errors = errors;
        fileData.isValid = errors.length === 0;
        setFiles(prev => [...prev]);
      } catch (error) {
        fileData.errors.push("Error parsing Excel file. Please check the format.");
        console.error("Excel parsing error:", error);
        setFiles(prev => [...prev]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (fileData: FileData, index: number) => {
    if (!fileData.isValid || fileData.data.length === 0 || !allPropertyIds) return;

    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, isUploading: true, uploadProgress: 0 } : f
    ));

    try {
      // Validate property IDs exist
      const errors: string[] = [];
      const validData: OccupancyData[] = [];

      for (const record of fileData.data) {
        if (!allPropertyIds.includes(record.propertyId)) {
          errors.push(`Property ID "${record.propertyId}" not found in database`);
        } else {
          validData.push(record);
        }
      }

      if (errors.length > 0) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, errors: [...f.errors, ...errors], isValid: false, isUploading: false } : f
        ));
        toast.error(`${errors.length} validation errors found in ${fileData.file.name}`);
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 90) } : f
        ));
      }, 100);

      await bulkUploadOccupancy({ data: validData });
      
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploadProgress: 100, isUploading: false } : f
      ));

      setUploadedCount(prev => prev + validData.length);
      toast.success(`Successfully uploaded ${validData.length} occupancy records from ${fileData.file.name}`);
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, isUploading: false, uploadProgress: 0 } : f
      ));
      toast.error(`Failed to upload ${fileData.file.name}. Please try again.`);
      console.error("Upload error:", error);
    }
  };

  const uploadAllFiles = async () => {
    const validFiles = files.filter(f => f.isValid && f.data.length > 0);
    if (validFiles.length === 0) {
      toast.error("No valid files to upload");
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);
    setUploadedCount(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const fileData = validFiles[i];
        await uploadSingleFile(fileData, files.findIndex(f => f.file.name === fileData.file.name));
        setOverallProgress(((i + 1) / validFiles.length) * 100);
      }
      
      toast.success(`Successfully uploaded ${uploadedCount} occupancy records from ${validFiles.length} files!`);
      
      // Reset form
      setFiles([]);
      setOverallProgress(0);
      setUploadedCount(0);
    } catch (error) {
      toast.error("Failed to upload some files. Please check the errors and try again.");
      console.error("Batch upload error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalRecords = files.reduce((sum, f) => sum + f.data.length, 0);
  const validFiles = files.filter(f => f.isValid);
  const totalValidRecords = validFiles.reduce((sum, f) => sum + f.data.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Occupancy Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload multiple Excel files with monthly occupancy data for existing properties.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Upload Excel Files
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
              disabled={isProcessing}
              multiple
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <Plus className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  Click to select Excel files
                </p>
                <p className="text-sm text-gray-500">
                  or drag and drop multiple files (.xlsx, .xls)
                </p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Files ({files.length})</h3>
                <div className="text-sm text-gray-500">
                  Total records: {totalRecords} | Valid: {totalValidRecords}
                </div>
              </div>

              <div className="space-y-4">
                {files.map((fileData, index) => (
                  <Card key={index} className={`border ${fileData.isValid ? 'border-green-200' : 'border-red-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{fileData.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {fileData.data.length} records | {fileData.file.size.toLocaleString()} bytes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {fileData.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="text-red-500 text-sm">Invalid</div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {fileData.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {fileData.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fileData.data.length > 0 && (
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
                                  Occupancy Rate
                                </th>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                  Occupied Units
                                </th>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                  Vacant Units
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {fileData.data.slice(0, 3).map((record, recordIndex) => (
                                <tr key={recordIndex}>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {record.propertyId}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {record.month}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {record.occupancyRate}%
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {record.occupiedUnits}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {record.vacantUnits}
                                  </td>
                                </tr>
                              ))}
                              {fileData.data.length > 3 && (
                                <tr>
                                  <td colSpan={5} className="border border-gray-200 px-3 py-2 text-sm text-gray-500 text-center">
                                    ... and {fileData.data.length - 3} more records
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {fileData.isUploading && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileData.uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {Math.round(fileData.uploadProgress)}% complete
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={uploadAllFiles}
                  disabled={isProcessing || validFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading All Files...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload All Valid Files ({validFiles.length})
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Overall progress: {Math.round(overallProgress)}% complete
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
                  <li>• occupancy rate</li>
                  <li>• occupied units</li>
                  <li>• vacant units</li>
                  <li>• total units</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Row:</h4>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  PROP001 | 2024-01 | 95.5 | 191 | 9 | 200
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Multiple File Upload Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload multiple Excel files at once</li>
                <li>• Individual file validation and error reporting</li>
                <li>• Property ID validation against existing properties</li>
                <li>• Batch processing with progress tracking</li>
                <li>• Duplicate file detection</li>
                <li>• Remove individual files before upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
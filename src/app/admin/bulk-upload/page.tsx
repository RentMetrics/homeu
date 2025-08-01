"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Loader2, Building2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface PropertyData {
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  yearBuilt: number;
  averageUnitSize: number;
}

interface FileData {
  file: File;
  data: PropertyData[];
  errors: string[];
  isValid: boolean;
  uploadProgress: number;
  isUploading: boolean;
}

export default function BulkUploadPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  
  const bulkUpload = useMutation(api.multifamilyproperties.bulkUpload);

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
          'property name',
          'address',
          'city',
          'state',
          'zip code',
          'total units',
          'year built',
          'average unit size'
        ];

        const isValidHeaders = expectedHeaders.every(header =>
          headers.some(h => h && h.toLowerCase().includes(header.toLowerCase()))
        );

        if (!isValidHeaders) {
          fileData.errors.push("Invalid Excel format. Please check the headers.");
          setFiles(prev => [...prev]);
          return;
        }

        const data: PropertyData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 9 && row[0]) {
            const propertyData = {
              propertyId: String(row[0] || ''),
              propertyName: String(row[1] || ''),
              address: String(row[2] || ''),
              city: String(row[3] || ''),
              state: String(row[4] || ''),
              zipCode: String(row[5] || ''),
              totalUnits: parseInt(row[6]) || 0,
              yearBuilt: parseInt(row[7]) || 0,
              averageUnitSize: parseFloat(row[8]) || 0,
            };

            // Validate data
            if (!propertyData.propertyId) {
              errors.push(`Row ${i + 1}: Missing property ID`);
            }
            if (!propertyData.propertyName) {
              errors.push(`Row ${i + 1}: Missing property name`);
            }
            if (propertyData.totalUnits <= 0) {
              errors.push(`Row ${i + 1}: Total units must be greater than 0`);
            }
            if (propertyData.yearBuilt < 1800 || propertyData.yearBuilt > new Date().getFullYear()) {
              errors.push(`Row ${i + 1}: Invalid year built`);
            }

            data.push(propertyData);
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
    if (!fileData.isValid || fileData.data.length === 0) return;

    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, isUploading: true, uploadProgress: 0 } : f
    ));

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 90) } : f
        ));
      }, 100);

             await bulkUpload({ properties: fileData.data });
      
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploadProgress: 100, isUploading: false } : f
      ));

      setUploadedCount(prev => prev + fileData.data.length);
      toast.success(`Successfully uploaded ${fileData.data.length} properties from ${fileData.file.name}`);
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

      toast.success(`Successfully uploaded ${uploadedCount} properties from ${validFiles.length} files!`);
      
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

  const totalProperties = files.reduce((sum, f) => sum + f.data.length, 0);
  const validFiles = files.filter(f => f.isValid);
  const totalValidProperties = validFiles.reduce((sum, f) => sum + f.data.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Properties</h1>
        <p className="text-muted-foreground mt-2">
          Upload multiple Excel files with multifamily property data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
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
                  Total properties: {totalProperties} | Valid: {totalValidProperties}
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
                              {fileData.data.length} properties | {fileData.file.size.toLocaleString()} bytes
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
                                  Property Name
                                </th>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                  City
                                </th>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                  Units
                                </th>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                  Year Built
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {fileData.data.slice(0, 3).map((property, propIndex) => (
                                <tr key={propIndex}>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {property.propertyId}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {property.propertyName}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {property.city}, {property.state}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {property.totalUnits}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {property.yearBuilt}
                                  </td>
                                </tr>
                              ))}
                              {fileData.data.length > 3 && (
                                <tr>
                                  <td colSpan={5} className="border border-gray-200 px-3 py-2 text-sm text-gray-500 text-center">
                                    ... and {fileData.data.length - 3} more properties
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
                  className="bg-green-600 hover:bg-green-700"
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
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
                  <li>• property name</li>
                  <li>• address</li>
                  <li>• city</li>
                  <li>• state</li>
                  <li>• zip code</li>
                  <li>• total units</li>
                  <li>• year built</li>
                  <li>• average unit size</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Row:</h4>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  PROP001 | Sunset Apartments | 123 Main St | Austin | TX | 78701 | 200 | 2010 | 850
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Multiple File Upload Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload multiple Excel files at once</li>
                <li>• Individual file validation and error reporting</li>
                <li>• Batch processing with progress tracking</li>
                <li>• Automatic property enrichment with Google data</li>
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
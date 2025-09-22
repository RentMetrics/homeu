'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Share2,
  ExternalLink,
  Trash2,
  Eye,
  Download,
  Copy,
  Shield,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserSync } from '@/hooks/useUserSync';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PinataService, { type DocumentMetadata } from '@/lib/pinata';
import { useDropzone } from 'react-dropzone';

interface DocumentSharingProps {
  onDocumentShared?: (ipfsHash: string) => void;
}

export function DocumentSharing({ onDocumentShared }: DocumentSharingProps) {
  const { user } = useUserSync();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'application' | 'lease' | 'income_verification' | 'id_document' | 'other'>('application');

  const storeDocument = useMutation(api.blockchain.storeIPFSDocument);
  const shareDocument = useMutation(api.blockchain.shareDocumentWithPropertyManagers);
  const deleteDocument = useMutation(api.blockchain.deleteIPFSDocument);
  const userDocuments = useQuery(
    api.blockchain.getUserIPFSDocuments,
    user?.id ? { userId: user.id } : "skip"
  );

  const documentTypes = [
    { value: 'application', label: 'Rental Application', icon: FileText },
    { value: 'lease', label: 'Lease Agreement', icon: FileText },
    { value: 'income_verification', label: 'Income Verification', icon: FileText },
    { value: 'id_document', label: 'ID Document', icon: Shield },
    { value: 'other', label: 'Other Document', icon: FileText },
  ];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user?.id) {
      toast.error('Please sign in to upload documents');
      return;
    }

    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, [user?.id, selectedDocumentType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadFile = async (file: File) => {
    if (!user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const metadata: DocumentMetadata = {
        fileName: file.name,
        fileType: file.type,
        userId: user.id,
        documentType: selectedDocumentType,
        uploadedAt: new Date().toISOString(),
        isShared: false,
      };

      // Upload to IPFS via Pinata
      const ipfsHash = await PinataService.uploadFile(file, metadata);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Store document reference in Convex
      await storeDocument({
        userId: user.id,
        fileName: file.name,
        fileType: file.type,
        documentType: selectedDocumentType,
        ipfsHash,
        isShared: false,
        fileSize: file.size,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      toast.success(`Document uploaded to IPFS: ${file.name}`);
      onDocumentShared?.(ipfsHash);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const shareDocumentWithPropertyManager = async (documentId: string, propertyManagerIds: string[]) => {
    try {
      await shareDocument({
        documentId: documentId as any,
        propertyManagerIds,
      });
      toast.success('Document shared with property managers');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share document');
    }
  };

  const copyIPFSLink = (ipfsHash: string) => {
    const link = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    navigator.clipboard.writeText(link);
    toast.success('IPFS link copied to clipboard');
  };

  const viewOnIPFS = (ipfsHash: string) => {
    const link = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(link, '_blank');
  };

  const deleteDocumentHandler = async (documentId: string, ipfsHash: string) => {
    try {
      // Delete from IPFS
      await PinataService.deleteFile(ipfsHash);

      // Delete from Convex
      await deleteDocument({ documentId: documentId as any });

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentIcon = (documentType: string) => {
    const type = documentTypes.find(t => t.value === documentType);
    return type ? type.icon : FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents to Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={selectedDocumentType} onValueChange={(value) => setSelectedDocumentType(value as 'application' | 'lease' | 'income_verification' | 'id_document' | 'other')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-green-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, PNG, JPG (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading to IPFS...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Benefits Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Blockchain Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Immutable document storage on IPFS</li>
              <li>• Cryptographic proof of document authenticity</li>
              <li>• Decentralized access - no single point of failure</li>
              <li>• Share documents securely with property managers</li>
              <li>• Maintain ownership and control of your data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* User Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents on IPFS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!userDocuments || userDocuments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No documents uploaded yet. Upload your first document above.
            </p>
          ) : (
            <div className="space-y-4">
              {userDocuments.map((doc) => {
                const IconComponent = getDocumentIcon(doc.documentType);
                return (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <IconComponent className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.fileName}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">
                            {documentTypes.find(t => t.value === doc.documentType)?.label}
                          </Badge>
                          {doc.fileSize && (
                            <span>{formatFileSize(doc.fileSize)}</span>
                          )}
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="font-mono truncate max-w-[200px]">
                            {doc.ipfsHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      {doc.isShared && (
                        <Badge className="bg-green-100 text-green-800">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyIPFSLink(doc.ipfsHash)}
                        title="Copy IPFS link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewOnIPFS(doc.ipfsHash)}
                        title="View on IPFS"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => shareDocumentWithPropertyManager(doc._id, ['demo-pm-id'])}
                        title="Share with property manager"
                        disabled={doc.isShared}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDocumentHandler(doc._id, doc.ipfsHash)}
                        title="Delete document"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
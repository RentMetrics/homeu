'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle, AlertCircle, Home } from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';

const verificationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  ssn: z.string().min(9, 'SSN must be at least 9 digits').optional(),
  address: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
  }),
  phone: z.string().min(10, 'Phone number is required'),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface StraddleVerificationFormProps {
  onVerificationComplete?: (isVerified: boolean) => void;
  className?: string;
}

export function StraddleVerificationForm({ 
  onVerificationComplete,
  className 
}: StraddleVerificationFormProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    idDocument?: string;
    proofOfIncome?: string;
    rentalHistory?: string;
  }>({});

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ssn: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: '',
      },
      phone: '',
    },
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: base64.split(',')[1] // Remove data URL prefix
        }));
        toast.success(`${documentType} uploaded successfully`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(`Failed to upload ${documentType}`);
    }
  };

  const onSubmit = async (data: VerificationFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/straddle/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          documents: Object.keys(uploadedDocuments).length > 0 ? uploadedDocuments : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit verification');
      }

      const result = await response.json();
      setVerificationStatus(result.verification.status);
      
      toast.success('Verification submitted successfully');
      
      if (onVerificationComplete) {
        onVerificationComplete(result.verification.status === 'approved');
      }

      // Refresh session to get updated verification status
      router.refresh();

    } catch (error) {
      toast.error('Failed to submit verification');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'approved':
        return 'Your verification has been approved! You are now a verified renter.';
      case 'rejected':
        return 'Your verification was rejected. Please check your information and try again.';
      case 'pending':
        return 'Your verification is being processed. This may take 1-2 business days.';
      default:
        return '';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span>Resident Verification</span>
            </div>
            {user.publicMetadata.verified && (
              <VerificationBadge isVerified={true} size="sm" />
            )}
          </CardTitle>
          <CardDescription>
            Complete your verification to become a verified HomeU renter and unlock bank payment features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium">
                  {verificationStatus === 'approved' && 'Verification Approved'}
                  {verificationStatus === 'rejected' && 'Verification Rejected'}
                  {verificationStatus === 'pending' && 'Verification Pending'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="XXX-XX-XXXX" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Your SSN helps with faster verification but is not required.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                
                <FormField
                  control={form.control}
                  name="address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
                            ].map(state => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Upload (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Uploading documents can help speed up the verification process.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID Document</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'idDocument');
                        }}
                        className="hidden"
                        id="idDocument"
                      />
                      <label htmlFor="idDocument" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Upload ID Document
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Proof of Income</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'proofOfIncome');
                        }}
                        className="hidden"
                        id="proofOfIncome"
                      />
                      <label htmlFor="proofOfIncome" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Upload Proof of Income
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rental History</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'rentalHistory');
                        }}
                        className="hidden"
                        id="rentalHistory"
                      />
                      <label htmlFor="rentalHistory" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Upload Rental History
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Verification...
                  </>
                ) : (
                  'Submit Verification'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 
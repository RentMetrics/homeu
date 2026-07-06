'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Building2,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  BanknoteIcon,
  Settings,
  Calendar,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { toast } from 'sonner';

type OnboardingStep = 'welcome' | 'business-info' | 'representative' | 'bank-connect' | 'settings' | 'complete';

interface BusinessInfo {
  companyName: string;
  email: string;
  taxId: string;
  businessType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship';
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
}

interface Representative {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  dateOfBirth: string;
}

export default function PropertyManagerPaymentSettings() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for success/canceled from bank connection
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [businessCustomerId, setBusinessCustomerId] = useState<string | null>(null);

  // Form state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    companyName: '',
    email: '',
    taxId: '',
    businessType: 'llc',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
    },
    phone: '',
  });

  const [representative, setRepresentative] = useState<Representative>({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    dateOfBirth: '',
  });

  const [payoutSettings, setPayoutSettings] = useState({
    payoutSchedule: 'monthly',
    defaultPayoutMethod: 'ach',
  });

  // Mock workosUserId - in production this would come from WorkOS session
  const workosUserId = 'workos_user_123';

  // Query payment collection status
  const paymentStatus = useQuery(api.propertyManagers.getPaymentCollectionStatus, {
    workosUserId,
  });

  // Mutation to setup payment collection in Convex
  const setupPaymentCollection = useMutation(api.propertyManagers.setupPaymentCollection);

  // Check if already onboarded
  useEffect(() => {
    if (paymentStatus?.isSetup) {
      setCurrentStep('complete');
      setBusinessCustomerId(paymentStatus.straddleCustomerId || null);
    }
  }, [paymentStatus]);

  // Handle bank connection callback
  useEffect(() => {
    if (success === 'true') {
      toast.success('Bank account connected successfully!');
      setCurrentStep('settings');
    } else if (canceled === 'true') {
      toast.error('Bank connection was canceled');
    }
  }, [success, canceled]);

  const handleBusinessInfoSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!businessInfo.companyName || !businessInfo.email || !businessInfo.taxId) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      setCurrentStep('representative');
    } catch (error) {
      toast.error('Failed to save business information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepresentativeSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!representative.firstName || !representative.lastName || !representative.email) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Create business customer in Straddle
      const response = await fetch('/api/straddle/pm-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workosUserId}`, // In production, use actual WorkOS token
        },
        body: JSON.stringify({
          ...businessInfo,
          representative,
          workosUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create business account');
      }

      setBusinessCustomerId(data.businessCustomerId);

      // If there's a connection URL, redirect to it
      if (data.connectionUrl) {
        window.location.href = data.connectionUrl;
      } else {
        setCurrentStep('bank-connect');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create business account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectBank = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/straddle/pm-setup?businessCustomerId=${businessCustomerId}`, {
        headers: {
          'Authorization': `Bearer ${workosUserId}`,
        },
      });

      const data = await response.json();

      if (data.connectionUrl) {
        window.location.href = data.connectionUrl;
      } else {
        // For sandbox mode, simulate success
        toast.success('Bank connected successfully (sandbox mode)');
        setCurrentStep('settings');
      }
    } catch (error) {
      toast.error('Failed to initiate bank connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    try {
      // Save to Convex
      await setupPaymentCollection({
        workosUserId,
        straddleCustomerId: businessCustomerId || `biz_${Date.now()}`,
        straddleBankAccountId: `bank_${Date.now()}`, // In production, this comes from Straddle
        payoutSchedule: payoutSettings.payoutSchedule,
        defaultPayoutMethod: payoutSettings.defaultPayoutMethod,
      });

      // Update payout settings in Straddle
      await fetch('/api/straddle/pm-setup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workosUserId}`,
        },
        body: JSON.stringify({
          businessCustomerId,
          ...payoutSettings,
        }),
      });

      toast.success('Payment setup complete!');
      setCurrentStep('complete');
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator
  const steps = [
    { id: 'welcome', label: 'Welcome', icon: Building2 },
    { id: 'business-info', label: 'Business Info', icon: Building },
    { id: 'representative', label: 'Representative', icon: User },
    { id: 'bank-connect', label: 'Bank Account', icon: BanknoteIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'complete', label: 'Complete', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/property-manager/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Payment Collection Setup</h1>
          <p className="text-gray-600 mt-1">
            Set up your account to receive rent payments from residents
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStepIndex
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {steps.map((step) => (
              <span key={step.id} className="w-10 text-center">
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Start Receiving Rent Payments</CardTitle>
              <CardDescription className="text-base mt-2">
                Set up your payment collection account to receive rent payments directly from your residents through HomeU.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <h3 className="font-medium">Secure Transfers</h3>
                  <p className="text-sm text-gray-600">Bank-level security for all transactions</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <h3 className="font-medium">Automatic Payouts</h3>
                  <p className="text-sm text-gray-600">Choose daily, weekly, or monthly deposits</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h3 className="font-medium">Track Everything</h3>
                  <p className="text-sm text-gray-600">Real-time payment tracking and reports</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setCurrentStep('business-info')}
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'business-info' && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Tell us about your property management company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, companyName: e.target.value })}
                    placeholder="ABC Property Management LLC"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                    placeholder="payments@yourcompany.com"
                  />
                </div>

                <div>
                  <Label htmlFor="taxId">EIN / Tax ID *</Label>
                  <Input
                    id="taxId"
                    value={businessInfo.taxId}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={businessInfo.businessType}
                    onValueChange={(value: any) => setBusinessInfo({ ...businessInfo, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">Business Phone *</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Business Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="line1">Street Address *</Label>
                    <Input
                      id="line1"
                      value={businessInfo.address.line1}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, line1: e.target.value }
                      })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="line2">Suite / Unit (Optional)</Label>
                    <Input
                      id="line2"
                      value={businessInfo.address.line2}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, line2: e.target.value }
                      })}
                      placeholder="Suite 100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={businessInfo.address.city}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, city: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={businessInfo.address.state}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, state: e.target.value }
                      })}
                      placeholder="CA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={businessInfo.address.zipCode}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, zipCode: e.target.value }
                      })}
                      placeholder="90210"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('welcome')}>
                Back
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleBusinessInfoSubmit}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'representative' && (
          <Card>
            <CardHeader>
              <CardTitle>Authorized Representative</CardTitle>
              <CardDescription>
                Information about the person authorized to manage payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={representative.firstName}
                    onChange={(e) => setRepresentative({ ...representative, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={representative.lastName}
                    onChange={(e) => setRepresentative({ ...representative, lastName: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="repEmail">Email *</Label>
                  <Input
                    id="repEmail"
                    type="email"
                    value={representative.email}
                    onChange={(e) => setRepresentative({ ...representative, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={representative.title}
                    onChange={(e) => setRepresentative({ ...representative, title: e.target.value })}
                    placeholder="Owner, Manager, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={representative.dateOfBirth}
                    onChange={(e) => setRepresentative({ ...representative, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Identity Verification</AlertTitle>
                <AlertDescription>
                  This information is used to verify your identity and comply with financial regulations.
                  Your data is encrypted and secure.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('business-info')}>
                Back
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleRepresentativeSubmit}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Continue to Bank Connection
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'bank-connect' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BanknoteIcon className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Connect Your Bank Account</CardTitle>
              <CardDescription className="text-base mt-2">
                Securely connect your business bank account to receive rent payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>256-bit encryption protects your data</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>We never store your login credentials</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Disconnect anytime from your settings</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('representative')}>
                Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConnectBank}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Connect Bank Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive your rent payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                <Select
                  value={payoutSettings.payoutSchedule}
                  onValueChange={(value) => setPayoutSettings({ ...payoutSettings, payoutSchedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Every Friday)</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly (1st & 15th)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  How often rent payments are deposited to your account
                </p>
              </div>

              <div>
                <Label htmlFor="payoutMethod">Payout Method</Label>
                <Select
                  value={payoutSettings.defaultPayoutMethod}
                  onValueChange={(value) => setPayoutSettings({ ...payoutSettings, defaultPayoutMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ach">ACH Transfer (2-3 business days)</SelectItem>
                    <SelectItem value="wire">Wire Transfer (Same day - additional fees may apply)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertTitle>Platform Fee</AlertTitle>
                <AlertDescription>
                  HomeU charges a 2.9% + $0.30 fee per rent payment processed. This is deducted from each
                  payment before payout.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('bank-connect')}>
                Back
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCompleteSetup}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Complete Setup
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your payment collection account is ready. You can now receive rent payments from your residents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-4">What's Next?</h3>
                <ul className="space-y-3 text-green-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Residents can now pay rent through HomeU
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Payments will be deposited per your schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Track all payments in your dashboard
                  </li>
                </ul>
              </div>

              {paymentStatus && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Account Details</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>Payout Schedule: {paymentStatus.payoutSchedule}</p>
                    <p>Payout Method: {paymentStatus.defaultPayoutMethod?.toUpperCase()}</p>
                    <p>Setup Date: {paymentStatus.paymentOnboardingDate
                      ? new Date(paymentStatus.paymentOnboardingDate).toLocaleDateString()
                      : 'N/A'}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/property-manager/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setCurrentStep('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

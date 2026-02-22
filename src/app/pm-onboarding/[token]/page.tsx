'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle,
  Loader2,
  CreditCard,
  ArrowRight,
  Shield,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

type Step = 'welcome' | 'bank-setup' | 'complete';

export default function PMOnboardingPage() {
  const params = useParams();
  const token = params.token as string;
  const [step, setStep] = useState<Step>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');

  const tokenData = useQuery(api.propertyManagers.validateOnboardingToken, { token });
  const completeOnboarding = useMutation(api.propertyManagers.completeOnboarding);

  if (tokenData === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tokenData.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              {tokenData.error || 'This onboarding link is no longer valid. Please contact your HomeU administrator for a new link.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pm = tokenData.pm!;

  const handleStartBankSetup = async () => {
    setIsSubmitting(true);
    try {
      // Call bank setup API to create customer and get connection link
      const response = await fetch('/api/straddle/pm-bank-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          pmName: `${pm.firstName} ${pm.lastName}`,
          companyName: pm.companyName,
          email: pm.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set up bank account');
      }

      const result = await response.json();

      // Complete the onboarding in Convex
      await completeOnboarding({
        token,
        straddleCustomerId: result.customerId,
        straddleBankAccountId: result.connectionId,
        payoutSchedule,
        payoutMethod: 'ach',
      });

      // If there's a connection URL, open it for bank linking
      if (result.connectionUrl) {
        window.open(result.connectionUrl, '_blank');
      }

      setStep('complete');
      toast.success('Account setup initiated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set up bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">Home</span>
            <span className="text-green-600">U</span>
          </h1>
          <p className="text-muted-foreground mt-1">Property Manager Onboarding</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {(['welcome', 'bank-setup', 'complete'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-green-600 text-white'
                  : (['welcome', 'bank-setup', 'complete'].indexOf(step) > i)
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {(['welcome', 'bank-setup', 'complete'].indexOf(step) > i) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  (['welcome', 'bank-setup', 'complete'].indexOf(step) > i) ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Welcome, {pm.firstName}!</CardTitle>
              <CardDescription>
                Complete your onboarding to start receiving rent payments through HomeU.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{pm.firstName} {pm.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{pm.companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{pm.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Your bank information is encrypted and securely processed through our payment partner.</p>
              </div>

              <Button
                className="w-full"
                onClick={() => setStep('bank-setup')}
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'bank-setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Connect Your Bank Account
              </CardTitle>
              <CardDescription>
                Set your payout preferences and connect your bank account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                <select
                  id="payoutSchedule"
                  value={payoutSchedule}
                  onChange={(e) => setPayoutSchedule(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 border rounded-lg text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" />
                <p>You'll be redirected to our secure payment partner to connect your bank account.</p>
              </div>

              <Button
                className="w-full"
                onClick={handleStartBankSetup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect Bank Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p className="text-muted-foreground">
                Your account has been set up. You'll start receiving rent payouts according to your selected schedule.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                <p className="font-medium">What happens next?</p>
                <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                  <li>Residents can now pay rent through HomeU</li>
                  <li>Payouts are deposited to your connected bank account</li>
                  <li>You'll receive email notifications for each payout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

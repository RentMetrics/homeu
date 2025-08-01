'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  CheckCircle, 
  Building2, 
  CreditCard, 
  Home, 
  Star,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { StraddleVerificationForm } from '@/components/straddle/StraddleVerificationForm';
import { StraddleBankConnection } from '@/components/straddle/StraddleBankConnection';
import { PropertySearchForm } from '@/components/onboarding/PropertySearchForm';
import { ManagementCompanyForm } from '@/components/onboarding/ManagementCompanyForm';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OnboardingStep = 'verification' | 'bank-connection' | 'property-search' | 'management-company' | 'complete';

interface OnboardingData {
  verificationComplete: boolean;
  bankConnected: boolean;
  propertyFound: boolean;
  managementCompanyConnected: boolean;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('verification');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    verificationComplete: false,
    bankConnected: false,
    propertyFound: false,
    managementCompanyConnected: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user && isLoaded) {
      checkOnboardingStatus();
    }
  }, [user, isLoaded]);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed verification
      const verificationResponse = await fetch('/api/straddle/verification');
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        if (verificationData.localVerification?.verified) {
          setOnboardingData(prev => ({ ...prev, verificationComplete: true }));
        }
      }

      // Check if user has connected bank accounts
      const bankResponse = await fetch('/api/straddle/bank-connection');
      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        if (bankData.bankAccounts && bankData.bankAccounts.length > 0) {
          setOnboardingData(prev => ({ ...prev, bankConnected: true }));
        }
      }

      // Check if user has linked properties
      // This would be a separate API call to check property connections
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleVerificationComplete = (isVerified: boolean) => {
    if (isVerified) {
      setOnboardingData(prev => ({ ...prev, verificationComplete: true }));
      setCurrentStep('bank-connection');
      toast.success('Verification completed! Now let\'s connect your bank account.');
    }
  };

  const handleBankConnectionComplete = (accounts: any[]) => {
    if (accounts.length > 0) {
      setOnboardingData(prev => ({ ...prev, bankConnected: true }));
      setCurrentStep('property-search');
      toast.success('Bank account connected! Now let\'s find your property.');
    }
  };

  const handlePropertyFound = (property: any) => {
    setOnboardingData(prev => ({ ...prev, propertyFound: true }));
    setCurrentStep('management-company');
    toast.success('Property found! Now let\'s connect with your management company.');
  };

  const handleManagementCompanyConnected = (managementCompany: any) => {
    setOnboardingData(prev => ({ ...prev, managementCompanyConnected: true }));
    setCurrentStep('complete');
    toast.success('Onboarding complete! You\'re all set to start using HomeU.');
  };

  const handleComplete = () => {
    setIsLoading(true);
    // Update user metadata to mark onboarding as complete
    if (user) {
      user.update({
        unsafeMetadata: {
          onboardingComplete: true,
          verified: true,
        }
      }).then(() => {
        onClose();
        router.push('/dashboard');
        toast.success('Welcome to HomeU! Your account is now fully set up.');
      }).catch((error) => {
        console.error('Error updating user metadata:', error);
        toast.error('Error completing onboarding. Please try again.');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  };

  const getStepStatus = (step: OnboardingStep) => {
    switch (step) {
      case 'verification':
        return onboardingData.verificationComplete ? 'complete' : 'current';
      case 'bank-connection':
        if (onboardingData.verificationComplete) {
          return onboardingData.bankConnected ? 'complete' : 'current';
        }
        return 'pending';
      case 'property-search':
        if (onboardingData.bankConnected) {
          return onboardingData.propertyFound ? 'complete' : 'current';
        }
        return 'pending';
      case 'management-company':
        if (onboardingData.propertyFound) {
          return onboardingData.managementCompanyConnected ? 'complete' : 'current';
        }
        return 'pending';
      case 'complete':
        return onboardingData.managementCompanyConnected ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (step: OnboardingStep) => {
    const status = getStepStatus(step);
    
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'current':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      default:
        switch (step) {
          case 'verification':
            return <Star className="h-6 w-6 text-gray-400" />;
          case 'bank-connection':
            return <CreditCard className="h-6 w-6 text-gray-400" />;
          case 'property-search':
            return <Home className="h-6 w-6 text-gray-400" />;
          case 'management-company':
            return <Building2 className="h-6 w-6 text-gray-400" />;
          default:
            return <CheckCircle className="h-6 w-6 text-gray-400" />;
        }
    }
  };

  const getStepTitle = (step: OnboardingStep) => {
    switch (step) {
      case 'verification':
        return 'Verify Your Identity';
      case 'bank-connection':
        return 'Connect Bank Account';
      case 'property-search':
        return 'Find Your Property';
      case 'management-company':
        return 'Connect Management Company';
      case 'complete':
        return 'Complete Setup';
      default:
        return '';
    }
  };

  const getStepDescription = (step: OnboardingStep) => {
    switch (step) {
      case 'verification':
        return 'Complete identity verification to become a verified renter';
      case 'bank-connection':
        return 'Connect your bank account for secure rent payments';
      case 'property-search':
        return 'Search and link your apartment complex';
      case 'management-company':
        return 'Connect with your property management company';
      case 'complete':
        return 'You\'re all set! Welcome to HomeU';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'verification':
        return (
          <StraddleVerificationForm
            onVerificationComplete={handleVerificationComplete}
            className="w-full"
          />
        );
      case 'bank-connection':
        return (
          <StraddleBankConnection
            onConnectionComplete={handleBankConnectionComplete}
            className="w-full"
          />
        );
      case 'property-search':
        return (
          <PropertySearchForm
            onPropertyFound={handlePropertyFound}
            className="w-full"
          />
        );
      case 'management-company':
        return (
          <ManagementCompanyForm
            onManagementCompanyConnected={handleManagementCompanyConnected}
            className="w-full"
          />
        );
      case 'complete':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Welcome to HomeU!</h3>
            <p className="text-muted-foreground mb-6">
              Your account is now fully set up. You can start managing your rent payments and earning rewards.
            </p>
            <Button 
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                'Go to Dashboard'
              )}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isLoaded || !user) {
    return null;
  }

  const steps: OnboardingStep[] = ['verification', 'bank-connection', 'property-search', 'management-company', 'complete'];

  const handlePrevious = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Your Setup</DialogTitle>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-green-600 text-white' 
                    : steps.indexOf(currentStep) > index 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {steps.indexOf(currentStep) > index ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    steps.indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'verification'}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {currentStep !== 'complete' ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
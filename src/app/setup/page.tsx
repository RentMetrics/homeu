"use client";

import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import VerificationModal from '@/components/verification/VerificationModal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  UserCheck,
  CreditCard,
  Building2,
  Shield,
  CheckCircle,
  Lock,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  User,
  Home,
} from "lucide-react";

export default function SetupPage() {
  const { user, isLoaded } = useUser();
  const {
    verificationStatus,
    showVerificationModal,
    setShowVerificationModal,
    markStepComplete,
    completeOnboarding,
    resetVerification
  } = useVerification();

  const steps = [
    {
      id: 'profile' as const,
      title: 'Complete Profile',
      description: 'Fill in your personal information, address, and employment',
      icon: <User className="h-6 w-6" />,
      required: true,
      href: '/get-started',
      actionLabel: 'Complete Profile',
      benefits: [
        'Pre-fill rental applications',
        'Enable rent payments',
        'Build your renter profile'
      ]
    },
    {
      id: 'property' as const,
      title: 'Link Your Property',
      description: 'Connect to the property where you live',
      icon: <Home className="h-6 w-6" />,
      required: true,
      href: '/get-started/link-property',
      actionLabel: 'Find Property',
      benefits: [
        'Connect with your property manager',
        'Enable rent payments',
        'Get property-specific insights'
      ]
    },
    {
      id: 'identity' as const,
      title: 'Identity Verification',
      description: 'Verify your identity to become a trusted renter',
      icon: <UserCheck className="h-6 w-6" />,
      required: true,
      href: null, // opens modal
      actionLabel: 'Verify Identity',
      benefits: [
        'Unlock all HomeU features',
        'Faster rental approvals',
        'Verified renter badge'
      ]
    },
    {
      id: 'bank' as const,
      title: 'Bank Account Setup',
      description: 'Connect your bank account for rent payments',
      icon: <CreditCard className="h-6 w-6" />,
      required: true,
      href: '/dashboard/payments',
      actionLabel: 'Connect Bank',
      benefits: [
        'Pay rent through HomeU',
        'Earn 200 reward points per payment',
        'Credit bureau reporting'
      ]
    },
    {
      id: 'credit' as const,
      title: 'Credit Score Connection',
      description: 'Connect your credit score for better rental opportunities',
      icon: <TrendingUp className="h-6 w-6" />,
      required: false,
      href: null, // opens modal
      actionLabel: 'Connect Credit',
      benefits: [
        'Better rental opportunities',
        'Real-time credit updates',
        'Landlord preference'
      ]
    },
    {
      id: 'rentalHistory' as const,
      title: 'Rental History',
      description: 'Import your rental history for faster approvals',
      icon: <Building2 className="h-6 w-6" />,
      required: false,
      href: null, // opens modal
      actionLabel: 'Import History',
      benefits: [
        'Faster applications',
        'Pre-filled information',
        'Better references'
      ]
    }
  ];

  const completedSteps = Object.values(verificationStatus.verificationSteps).filter(Boolean).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="mb-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Complete Your Setup</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Finish these steps to unlock rent payments, credit reporting, and rewards.
        </p>

        {/* Progress */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-gray-500">
            {completedSteps} of {totalSteps} steps completed
          </p>
        </div>
      </div>

      {/* All Complete */}
      {verificationStatus.isVerified && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">You're All Set!</h2>
            <p className="text-green-700 mb-4">
              Your profile is complete. You can now pay rent, earn rewards, and build credit.
            </p>
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {steps.map((step, index) => {
          const isCompleted = verificationStatus.verificationSteps[step.id];

          return (
            <Card
              key={step.id}
              className={`transition-all duration-200 ${
                isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-normal">Step {index + 1}</span>
                        {step.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {isCompleted ? (
                    <Badge className="bg-green-100 text-green-800 shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  ) : step.required ? (
                    <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400 shrink-0">Optional</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-1">
                  {step.benefits.map((benefit, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {!isCompleted && (
                  step.href ? (
                    <Link href={step.href}>
                      <Button className="w-full" variant={step.required ? "default" : "outline"}>
                        {step.actionLabel}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => setShowVerificationModal(true)}
                      className="w-full"
                      variant={step.required ? "default" : "outline"}
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Notice */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">Your Security is Our Priority</h3>
              <p className="text-sm text-gray-600 mb-3">
                All information is encrypted and stored securely. We use bank-level security protocols
                to protect your personal and financial information.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>256-bit encryption for all data</li>
                <li>Read-only access to bank accounts</li>
                <li>Secure connections to credit bureaus</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
}

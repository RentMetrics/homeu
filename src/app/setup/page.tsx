"use client";

import { useState } from "react";
import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import VerificationModal from '@/components/verification/VerificationModal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  UserCheck, 
  CreditCard, 
  Building2, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Lock,
  TrendingUp,
  DollarSign,
  FileText,
  ArrowRight
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
      id: 'identity',
      title: 'Identity Verification',
      description: 'Verify your identity to become a trusted renter',
      icon: <UserCheck className="h-6 w-6" />,
      required: true,
      benefits: [
        'Unlock all HomeU features',
        'Faster rental approvals',
        'Trusted renter status'
      ]
    },
    {
      id: 'bank',
      title: 'Bank Account Setup',
      description: 'Connect your bank account for rent payments',
      icon: <CreditCard className="h-6 w-6" />,
      required: true,
      benefits: [
        'Automatic rent payments',
        'Bank-level security',
        'Faster processing'
      ]
    },
    {
      id: 'credit',
      title: 'Credit Score Connection',
      description: 'Connect your credit score for better rental opportunities',
      icon: <TrendingUp className="h-6 w-6" />,
      required: true,
      benefits: [
        'Better rental opportunities',
        'Real-time credit updates',
        'Landlord preference'
      ]
    },
    {
      id: 'rental-history',
      title: 'Rental History',
      description: 'Import your rental history for faster approvals',
      icon: <Building2 className="h-6 w-6" />,
      required: false,
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
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Become a verified renter to unlock all HomeU features, faster rental approvals, and better rental opportunities.
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

      {/* Verification Status */}
      {verificationStatus.isVerified && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">Profile Complete!</h2>
            <p className="text-green-700 mb-4">
              You're now a verified renter with access to all HomeU features.
            </p>
            <Button 
              onClick={resetVerification}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Reset Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Steps Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {steps.map((step) => {
          const isCompleted = verificationStatus.verificationSteps[step.id as keyof typeof verificationStatus.verificationSteps];
          
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
                    <div className={`
                      p-2 rounded-lg ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {step.title}
                        {step.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Benefits:</h4>
                  <ul className="space-y-1">
                    {step.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {!isCompleted && (
                  <Button 
                    onClick={() => setShowVerificationModal(true)}
                    className="w-full"
                    variant={step.required ? "default" : "outline"}
                  >
                    {step.required ? 'Complete Now' : 'Complete (Optional)'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      {!verificationStatus.isVerified && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Ready to Get Started?
            </h2>
            <p className="text-blue-700 mb-4">
              Complete your verification to unlock all HomeU features and become a trusted renter.
            </p>
            <Button 
              onClick={() => setShowVerificationModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Start Verification Process
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

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
                <li>• 256-bit encryption for all data transmission</li>
                <li>• Read-only access to bank accounts</li>
                <li>• Secure connections to credit bureaus</li>
                <li>• No storage of sensitive documents</li>
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
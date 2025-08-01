"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  UserCheck, 
  CreditCard, 
  Building2, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Lock,
  TrendingUp,
  DollarSign,
  FileText
} from "lucide-react";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'completed' | 'current';
  required: boolean;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function VerificationModal({ isOpen, onClose, onComplete }: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Verify your identity to become a trusted renter',
      icon: <UserCheck className="h-6 w-6" />,
      status: 'current',
      required: true
    },
    {
      id: 'bank',
      title: 'Bank Account Setup',
      description: 'Connect your bank account for rent payments',
      icon: <CreditCard className="h-6 w-6" />,
      status: 'pending',
      required: true
    },
    {
      id: 'credit',
      title: 'Credit Score Connection',
      description: 'Connect your credit score for better rental opportunities',
      icon: <TrendingUp className="h-6 w-6" />,
      status: 'pending',
      required: true
    },
    {
      id: 'rental-history',
      title: 'Rental History',
      description: 'Import your rental history for faster approvals',
      icon: <Building2 className="h-6 w-6" />,
      status: 'pending',
      required: false
    }
  ]);

  const progress = (steps.filter(step => step.status === 'completed').length / steps.length) * 100;

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'completed' as const }
        : step
    ));
    
    // Move to next step
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(currentIndex + 1);
      setSteps(prev => prev.map((step, index) => 
        index === currentIndex + 1 
          ? { ...step, status: 'current' as const }
          : step
      ));
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const renderStepContent = (step: VerificationStep) => {
    switch (step.id) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verify Your Identity</h3>
              <p className="text-gray-600 mb-6">
                Complete identity verification to unlock all HomeU features and become a verified renter.
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card className="border-2 border-blue-100 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Government ID Verification</h4>
                      <p className="text-sm text-gray-600">Upload a valid government-issued ID</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-blue-100 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Proof of Income</h4>
                      <p className="text-sm text-gray-600">Provide recent pay stubs or bank statements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-blue-100 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Employment Verification</h4>
                      <p className="text-sm text-gray-600">Verify your current employment status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={() => handleStepComplete('identity')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Start Identity Verification
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'bank':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Bank Account</h3>
              <p className="text-gray-600 mb-6">
                Securely connect your bank account to enable automatic rent payments and faster processing.
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card className="border-2 border-green-100 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Bank-Level Security</h4>
                      <p className="text-sm text-gray-600">256-bit encryption and read-only access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-100 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Automatic Rent Payments</h4>
                      <p className="text-sm text-gray-600">Never miss a rent payment again</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-100 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Faster Approvals</h4>
                      <p className="text-sm text-gray-600">Landlords trust verified bank connections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={() => handleStepComplete('bank')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Connect Bank Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'credit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Credit Score</h3>
              <p className="text-gray-600 mb-6">
                Import your credit score from major bureaus to improve your rental applications.
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card className="border-2 border-purple-100 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Secure Connection</h4>
                      <p className="text-sm text-gray-600">Direct connection to credit bureaus</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-100 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Real-time Updates</h4>
                      <p className="text-sm text-gray-600">Always have your latest credit score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-100 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Better Rental Opportunities</h4>
                      <p className="text-sm text-gray-600">Landlords prefer verified credit scores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={() => handleStepComplete('credit')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Connect Credit Score
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'rental-history':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Import Rental History</h3>
              <p className="text-gray-600 mb-6">
                Import your rental history to speed up future applications and build trust with landlords.
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card className="border-2 border-orange-100 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Previous Landlords</h4>
                      <p className="text-sm text-gray-600">Add contact information for references</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-orange-100 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Payment History</h4>
                      <p className="text-sm text-gray-600">Document your rent payment history</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-orange-100 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Faster Applications</h4>
                      <p className="text-sm text-gray-600">Pre-filled information saves time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => handleStepComplete('rental-history')}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Import History
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => handleStepComplete('rental-history')}
                variant="outline"
                className="flex-1"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const allStepsCompleted = steps.every(step => step.status === 'completed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </DialogTitle>
          <p className="text-center text-gray-600">
            Become a verified renter to unlock all HomeU features
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="text-center">
              <div className={`
                w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium
                ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                  step.status === 'current' ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="text-xs text-gray-500">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="mt-6">
          {renderStepContent(steps[currentStep])}
        </div>

        {/* Completion State */}
        {allStepsCompleted && (
          <div className="text-center space-y-4 mt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold text-green-600">Profile Complete!</h3>
            <p className="text-gray-600">
              You're now a verified renter with access to all HomeU features.
            </p>
            <Button 
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Get Started
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
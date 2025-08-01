import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface VerificationStatus {
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
  verificationSteps: {
    identity: boolean;
    bank: boolean;
    credit: boolean;
    rentalHistory: boolean;
  };
}

export function useVerification() {
  const { user, isLoaded } = useUser();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isVerified: false,
    hasCompletedOnboarding: false,
    verificationSteps: {
      identity: false,
      bank: false,
      credit: false,
      rentalHistory: false,
    }
  });

  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      
      if (!hasCompletedOnboarding) {
        // Show verification modal for new users
        setShowVerificationModal(true);
      } else {
        // Check verification status from user metadata or local storage
        const storedStatus = localStorage.getItem(`verification_status_${user.id}`);
        if (storedStatus) {
          setVerificationStatus(JSON.parse(storedStatus));
        }
      }
    }
  }, [isLoaded, user]);

  const markStepComplete = (step: keyof VerificationStatus['verificationSteps']) => {
    const updatedStatus = {
      ...verificationStatus,
      verificationSteps: {
        ...verificationStatus.verificationSteps,
        [step]: true,
      }
    };

    // Check if all required steps are complete
    const allRequiredComplete = updatedStatus.verificationSteps.identity && 
                               updatedStatus.verificationSteps.bank && 
                               updatedStatus.verificationSteps.credit;

    if (allRequiredComplete) {
      updatedStatus.isVerified = true;
      updatedStatus.hasCompletedOnboarding = true;
    }

    setVerificationStatus(updatedStatus);

    // Store in localStorage
    if (user) {
      localStorage.setItem(`verification_status_${user.id}`, JSON.stringify(updatedStatus));
      if (updatedStatus.hasCompletedOnboarding) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
    }
  };

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      setShowVerificationModal(false);
    }
  };

  const resetVerification = () => {
    if (user) {
      localStorage.removeItem(`verification_status_${user.id}`);
      localStorage.removeItem(`onboarding_completed_${user.id}`);
      setVerificationStatus({
        isVerified: false,
        hasCompletedOnboarding: false,
        verificationSteps: {
          identity: false,
          bank: false,
          credit: false,
          rentalHistory: false,
        }
      });
      setShowVerificationModal(true);
    }
  };

  return {
    verificationStatus,
    showVerificationModal,
    setShowVerificationModal,
    markStepComplete,
    completeOnboarding,
    resetVerification,
    isLoaded,
  };
} 
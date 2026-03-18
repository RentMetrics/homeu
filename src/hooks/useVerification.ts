import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface VerificationStatus {
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
  verificationSteps: {
    profile: boolean;
    property: boolean;
    identity: boolean;
    bank: boolean;
    credit: boolean;
    rentalHistory: boolean;
  };
}

export function useVerification() {
  const { user, isLoaded } = useUser();

  // Query the actual renter profile from Convex
  const userProfile = useQuery(
    api.users.getUserProfile,
    isLoaded && user ? { userId: user.id } : 'skip'
  );

  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Derive verification status from real database state
  const verificationStatus: VerificationStatus = (() => {
    if (!userProfile) {
      return {
        isVerified: false,
        hasCompletedOnboarding: false,
        verificationSteps: {
          profile: false,
          property: false,
          identity: false,
          bank: false,
          credit: false,
          rentalHistory: false,
        },
      };
    }

    const profileComplete = !!(
      userProfile.firstName &&
      userProfile.lastName &&
      userProfile.phoneNumber &&
      userProfile.dateOfBirth &&
      userProfile.street &&
      userProfile.city &&
      userProfile.state &&
      userProfile.zipCode
    );

    const propertyLinked = !!(
      userProfile.propertyId &&
      userProfile.propertyLinkStatus &&
      userProfile.propertyLinkStatus !== 'unlinked'
    );

    const identityVerified = !!(
      userProfile.verified ||
      userProfile.verificationStatus === 'VERIFIED' ||
      userProfile.verificationStatus === 'verified'
    );

    const bankLinked = !!userProfile.straddleCustomerId;

    // Credit and rental history — check localStorage as fallback
    // until we have dedicated tracking for these
    const storedStatus = typeof window !== 'undefined' && user
      ? localStorage.getItem(`verification_status_${user.id}`)
      : null;
    const stored = storedStatus ? JSON.parse(storedStatus) : null;

    const creditConnected = stored?.verificationSteps?.credit || false;
    const rentalHistoryDone = stored?.verificationSteps?.rentalHistory || false;

    const steps = {
      profile: profileComplete,
      property: propertyLinked,
      identity: identityVerified,
      bank: bankLinked,
      credit: creditConnected,
      rentalHistory: rentalHistoryDone,
    };

    // All required steps: profile, property, identity, bank
    const allRequiredComplete = steps.profile && steps.identity && steps.bank;

    return {
      isVerified: allRequiredComplete,
      hasCompletedOnboarding: allRequiredComplete,
      verificationSteps: steps,
    };
  })();

  const markStepComplete = (step: keyof VerificationStatus['verificationSteps']) => {
    // For steps tracked in localStorage (credit, rentalHistory)
    if (user && (step === 'credit' || step === 'rentalHistory')) {
      const storedStatus = localStorage.getItem(`verification_status_${user.id}`);
      const stored = storedStatus ? JSON.parse(storedStatus) : {
        verificationSteps: { credit: false, rentalHistory: false },
      };
      stored.verificationSteps[step] = true;
      localStorage.setItem(`verification_status_${user.id}`, JSON.stringify(stored));
    }
    // profile, property, identity, bank are derived from DB state automatically
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

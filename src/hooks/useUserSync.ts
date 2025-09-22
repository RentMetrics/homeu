'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const userProfile = useQuery(
    api.users.getUserProfile,
    user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user data to Convex
      createOrUpdateUser({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || '',
        imageUrl: user.imageUrl,
      });
    }
  }, [isLoaded, user, createOrUpdateUser]);

  return {
    user,
    userProfile,
    isLoaded,
    isAuthenticated: !!user,
  };
}
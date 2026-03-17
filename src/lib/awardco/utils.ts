/**
 * Awardco Utility Functions
 */

import { HomeURewardActivity } from './types';

/**
 * Map HomeU activities to Awardco point values
 */
export function mapHomeUActivityToPoints(activityType: HomeURewardActivity['activityType']): number {
  const pointsMap: Record<HomeURewardActivity['activityType'], number> = {
    'rent_payment': 50,          // On-time rent payment
    'referral': 100,             // Successful referral
    'profile_completion': 25,     // Complete profile
    'verification': 50,           // Identity verification
    'review': 20,                 // Write a review
    'maintenance_report': 15,     // Report maintenance issue
  };

  return pointsMap[activityType] || 0;
}

/**
 * Sync HomeU user to Awardco platform
 */
export function syncUserToAwardco(homeuUser: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clerkId?: string;
}) {
  return {
    employeeId: homeuUser.id,
    email: homeuUser.email,
    firstName: homeuUser.firstName,
    lastName: homeuUser.lastName,
    username: homeuUser.email,
    metadata: {
      homeuUserId: homeuUser.id,
      clerkUserId: homeuUser.clerkId,
      source: 'HomeU',
      syncedAt: new Date().toISOString(),
    },
  };
}

/**
 * Format recognition message for HomeU activities
 */
export function formatRecognitionMessage(activity: HomeURewardActivity): string {
  const messages: Record<HomeURewardActivity['activityType'], string> = {
    'rent_payment': `Congratulations on your on-time rent payment! You've earned ${activity.points} points. Keep up the great work! 🏠`,
    'referral': `Thank you for referring a friend to HomeU! You've earned ${activity.points} points. Sharing is caring! 🎉`,
    'profile_completion': `Great job completing your profile! You've earned ${activity.points} points. Welcome to the community! 👤`,
    'verification': `Your identity has been verified! You've earned ${activity.points} points. Security matters! ✅`,
    'review': `Thanks for sharing your feedback! You've earned ${activity.points} points. Your voice matters! ⭐`,
    'maintenance_report': `Thank you for reporting the maintenance issue! You've earned ${activity.points} points. Keeping our community great! 🔧`,
  };

  return messages[activity.activityType] || activity.description;
}

/**
 * Calculate total points from multiple activities
 */
export function calculateTotalPoints(activities: HomeURewardActivity[]): number {
  return activities.reduce((total, activity) => total + activity.points, 0);
}

/**
 * Validate Awardco webhook signature
 * Uses HMAC-SHA256 for verification
 */
export async function validateAwardcoWebhook(
  body: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${body}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return computedSignature === signature;
}

/**
 * Check if webhook is within acceptable time window (5 minutes)
 */
export function isWebhookTimestampValid(timestamp: string): boolean {
  const webhookTime = parseInt(timestamp) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return Math.abs(currentTime - webhookTime) < fiveMinutes;
}

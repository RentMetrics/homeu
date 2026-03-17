/**
 * Awardco TypeScript Types
 */

export interface AwardcoUser {
  employeeId: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  balance?: number;
  metadata?: Record<string, any>;
}

export interface AwardcoRecognition {
  id: string;
  recipient: string;
  giver: string;
  message: string;
  amount: number;
  programName: string;
  timestamp: string;
  tags?: string[];
}

export interface AwardcoRedemption {
  id: string;
  userId: string;
  amount: number;
  itemName: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface AwardcoReward {
  id: string;
  title: string;
  description: string;
  points: number;
  category: 'gift_card' | 'merchandise' | 'experience' | 'custom';
  imageUrl?: string;
  available: boolean;
}

export interface AwardcoWebhookEvent {
  companyId: number;
  companyName: string;
  companyUrl: string;
  eventType: 'recognition.created' | 'redemption.completed' | 'user.created' | 'points.awarded';
  timestamp: string;
  data: any;
}

export interface AwardcoApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface AwardcoApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type AwardcoApiResponse<T = any> = AwardcoApiSuccess<T> | AwardcoApiError;

/**
 * HomeU-specific Awardco integration types
 */
export interface HomeUAwardcoUser extends AwardcoUser {
  homeuUserId: string;
  clerkUserId?: string;
  syncedAt: string;
}

export interface HomeURewardActivity {
  activityType: 'rent_payment' | 'referral' | 'profile_completion' | 'verification' | 'review' | 'maintenance_report';
  points: number;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

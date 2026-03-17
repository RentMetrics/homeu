/**
 * Awardco Integration for HomeU
 *
 * This module provides the main exports for integrating Awardco's
 * recognition and rewards platform with the HomeU application.
 */

export { AwardcoClient, createAwardcoClient } from './client';
export type {
  AwardcoConfig,
  RecognitionRequest,
  RewardRequest,
  UserBalanceRequest,
  UserBalanceResponse,
  RecognitionResponse,
  RewardResponse,
  ReportRequest,
} from './client';

export type {
  AwardcoUser,
  AwardcoRecognition,
  AwardcoRedemption,
  AwardcoReward,
  AwardcoWebhookEvent,
  AwardcoApiError,
  AwardcoApiSuccess,
  AwardcoApiResponse,
  HomeUAwardcoUser,
  HomeURewardActivity,
} from './types';

export { mapHomeUActivityToPoints, syncUserToAwardco } from './utils';

// SAML SSO exports
export {
  buildSAMLResponse,
  encodeSAMLResponse,
  generateSSOPayload,
  getSAMLConfig,
  isSSOConfigured,
} from './saml';
export type { SAMLUser, SAMLConfig } from './saml';

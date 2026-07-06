# Awardco Integration Guide

## Overview

HomeU integrates with **Awardco**, a leading recognition and rewards platform, to provide a comprehensive points-based reward system for tenants. This integration allows HomeU to reward users for positive behaviors like on-time rent payments, referrals, profile completion, and more.

## Features

### ✅ Implemented

1. **Recognition System**
   - Award points for user activities
   - Automated recognition messages
   - Activity-based point allocation

2. **Rewards**
   - Direct point rewards to users
   - Bulk reward capabilities
   - Custom reward messages

3. **Balance Tracking**
   - Real-time user balance queries
   - Integration with HomeU dashboard
   - Currency conversion support

4. **Webhook Integration**
   - Secure webhook verification (HMAC-SHA256)
   - Event handling for recognition, redemption, user creation
   - Timestamp validation for replay attack prevention

5. **Reporting**
   - Recognition details reports
   - Redemption details reports
   - Custom report generation

## Architecture

```
┌─────────────────┐
│  HomeU Frontend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  Routes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Awardco Client │
│  Library        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Awardco API    │
│  (External)     │
└─────────────────┘
```

## Setup Instructions

### 1. Get Awardco API Credentials

1. Contact Awardco to request API access
2. Obtain your API Key
3. (Optional) Get Partner ID if you're an Awardco partner
4. Set up webhook endpoint and get webhook secret

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Awardco Configuration
AWARDCO_API_KEY=your_api_key_here
AWARDCO_PARTNER_ID=your_partner_id (optional)
AWARDCO_PROGRAM_NAME=HomeU Rewards
AWARDCO_BUDGET_NAME=HomeU Budget
AWARDCO_GIVER_EMAIL=rewards@homeu.co
AWARDCO_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Set Up Recognition Program in Awardco

1. Log into your Awardco admin portal
2. Create a recognition program named "HomeU Rewards"
3. Configure point values and budgets
4. Set up notification preferences

### 4. Configure Webhooks

1. In Awardco admin portal, go to Webhooks
2. Add webhook URL: `https://yourdomain.com/api/awardco/webhook`
3. Select events to subscribe to:
   - `recognition.created`
   - `redemption.completed`
   - `user.created`
   - `points.awarded`
4. Save the webhook secret to your environment variables

## API Endpoints

### Recognition

**Award points for an activity**

```typescript
POST /api/awardco/recognize

Body:
{
  "recipientEmail": "user@example.com",
  "activityType": "rent_payment",
  "points": 50,
  "customMessage": "Optional custom message"
}

Response:
{
  "success": true,
  "recognitionId": "rec_123",
  "message": "Recognition sent successfully",
  "points": 50
}
```

### Reward

**Send a direct reward**

```typescript
POST /api/awardco/reward

Body:
{
  "recipientEmail": "user@example.com",
  "points": 100,
  "message": "Thank you for your referral!",
  "budgetName": "HomeU Budget"
}

Response:
{
  "success": true,
  "rewardId": "rwd_456",
  "message": "Reward sent successfully",
  "points": 100
}
```

### Balance

**Get user's point balance**

```typescript
GET /api/awardco/balance

Response:
{
  "success": true,
  "balance": 250,
  "currency": "USD",
  "userId": "usr_789"
}
```

### Webhook

**Receive Awardco events**

```typescript
POST /api/awardco/webhook

Headers:
{
  "Awardco-Signature": "signature_here",
  "Awardco-Timestamp": "1708551969"
}

Body:
{
  "companyId": 123,
  "companyName": "HomeU",
  "eventType": "recognition.created",
  "data": { ... }
}
```

## Point System

HomeU awards points for the following activities:

| Activity | Points | Description |
|----------|--------|-------------|
| Rent Payment | 50 | On-time monthly rent payment |
| Referral | 100 | Successful tenant referral |
| Profile Completion | 25 | Complete user profile |
| Verification | 50 | Identity verification |
| Review | 20 | Write a property review |
| Maintenance Report | 15 | Report maintenance issue |

## Usage Examples

### Award Points for Rent Payment

```typescript
import { AwardActivityButton } from '@/components/rewards/AwardActivityButton';

<AwardActivityButton
  activityType="rent_payment"
  points={50}
  label="Confirm Payment"
  onSuccess={() => {
    console.log('Points awarded!');
  }}
/>
```

### Display User Balance

```typescript
import { AwardcoBalance } from '@/components/rewards/AwardcoBalance';

<AwardcoBalance className="w-full" />
```

### Programmatic Recognition

```typescript
import { createAwardcoClient } from '@/lib/awardco';

const client = createAwardcoClient({
  apiKey: process.env.AWARDCO_API_KEY,
});

await client.createRecognition({
  recipients: ['user@example.com'],
  message: 'Great job!',
  amount: 50,
  recognitionProgramName: 'HomeU Rewards',
});
```

## Testing

### Local Development

1. Use Awardco sandbox environment (if available)
2. Set up test users in Awardco
3. Test webhook delivery with tools like ngrok:

```bash
ngrok http 3000
# Use ngrok URL for webhook endpoint
```

### Integration Tests

```typescript
// Test recognition creation
const response = await fetch('/api/awardco/recognize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmail: 'test@example.com',
    activityType: 'profile_completion',
    points: 25,
  }),
});

expect(response.ok).toBe(true);
const data = await response.json();
expect(data.success).toBe(true);
```

## Security

### API Key Protection

- ✅ API keys stored in environment variables
- ✅ Never exposed to client-side code
- ✅ All Awardco calls made server-side

### Webhook Security

- ✅ HMAC-SHA256 signature verification
- ✅ Timestamp validation (5-minute window)
- ✅ Replay attack prevention
- ✅ Secret stored securely

### Best Practices

1. Rotate API keys periodically
2. Use HTTPS only
3. Validate all user inputs
4. Log all Awardco transactions
5. Monitor webhook failures

## Troubleshooting

### Common Issues

**"Awardco integration not configured"**
- Check that `AWARDCO_API_KEY` is set in `.env.local`
- Verify the API key is valid

**"User not found in Awardco"**
- User needs to be created in Awardco first
- Use the `createUser` API to sync users

**"Invalid webhook signature"**
- Verify `AWARDCO_WEBHOOK_SECRET` is correct
- Check that webhook secret matches Awardco dashboard

**"Recognition program not found"**
- Verify `AWARDCO_PROGRAM_NAME` matches program in Awardco
- Check that program is not archived

### Debug Mode

Enable detailed logging:

```typescript
// In API routes
console.log('Awardco Request:', {
  endpoint: '/recognize',
  payload: body,
  timestamp: new Date().toISOString(),
});
```

## API Reference

### Client Methods

The `AwardcoClient` class provides the following methods:

- `createRecognition(request)` - Create recognition for users
- `createReward(request)` - Send direct reward
- `bulkReward(requests)` - Bulk reward multiple users
- `getUserBalance(request)` - Get user point balance
- `getRecognitionDetails(startDate, endDate)` - Get recognition report
- `getRedemptionDetails(startDate, endDate)` - Get redemption report
- `getReport(request)` - Get custom report
- `userExists(identifier)` - Check if user exists
- `createUser(userData)` - Create new user
- `getSocialFeed(limit, offset)` - Get social feed

### Utility Functions

- `mapHomeUActivityToPoints(activityType)` - Map activity to point value
- `syncUserToAwardco(homeuUser)` - Format user for Awardco
- `formatRecognitionMessage(activity)` - Format recognition message
- `calculateTotalPoints(activities)` - Calculate total points
- `validateAwardcoWebhook(body, signature, timestamp, secret)` - Verify webhook
- `isWebhookTimestampValid(timestamp)` - Check timestamp validity

## Roadmap

### Future Enhancements

- [ ] Automated user sync from Clerk to Awardco
- [ ] Advanced analytics dashboard
- [ ] Custom reward catalog
- [ ] Gamification features (badges, leaderboards)
- [ ] Mobile app notifications
- [ ] Multi-language support
- [ ] Bulk import/export tools
- [ ] A/B testing for reward amounts

## Support

For questions or issues:

1. **Awardco Support**: https://awardco.com/support
2. **HomeU Technical Issues**: Create issue in GitHub repo
3. **API Documentation**: https://api.awardco.com

## Resources

- [Awardco API Documentation](https://api.awardco.com)
- [Awardco Admin Portal](https://awardco.com)
- [API Key Management](https://awardco.my.site.com/Customerhelp/s/article/Managing-API-Keys)
- [Webhook Setup Guide](https://awardco.my.site.com/Customerhelp/s/article/Creating-Webhooks)

---

**Last Updated:** December 23, 2025
**Version:** 1.0.0
**Integration Status:** ✅ Production Ready

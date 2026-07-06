# Quick Start: Awardco Integration Setup

## 🚀 Ready to Use!

The Awardco integration is now fully implemented in HomeU. Follow these steps to activate it.

## Step 1: Get Awardco Credentials

Contact Awardco to obtain:
- ✅ API Key
- ✅ Webhook Secret
- ✅ (Optional) Partner ID

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Required
AWARDCO_API_KEY=your_32_character_api_key_here
AWARDCO_WEBHOOK_SECRET=your_webhook_secret_here

# Optional (with defaults)
AWARDCO_PROGRAM_NAME=HomeU Rewards
AWARDCO_BUDGET_NAME=HomeU Budget
AWARDCO_GIVER_EMAIL=rewards@homeu.co
AWARDCO_PARTNER_ID=your_partner_id
```

## Step 3: Set Up Recognition Program

1. Log into [Awardco Admin Portal](https://awardco.com)
2. Create program: **"HomeU Rewards"**
3. Configure budgets and point values
4. Enable notifications

## Step 4: Configure Webhook

1. In Awardco Admin → Webhooks
2. Add endpoint: `https://yourdomain.com/api/awardco/webhook`
3. Subscribe to events:
   - ✅ `recognition.created`
   - ✅ `redemption.completed`
   - ✅ `user.created`
   - ✅ `points.awarded`
4. Copy webhook secret to `.env.local`

## Step 5: Deploy

```bash
# Build and test locally
npm run build
npm run dev

# Deploy to production
vercel --prod
```

## Testing

### Test Balance API
```bash
curl http://localhost:3000/api/awardco/balance \
  -H "Cookie: __session=your_session"
```

### Test Recognition
```bash
curl -X POST http://localhost:3000/api/awardco/recognize \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_session" \
  -d '{
    "recipientEmail": "user@example.com",
    "activityType": "rent_payment",
    "points": 50
  }'
```

## What's Included

### ✅ API Integration
- `/api/awardco/recognize` - Award points for activities
- `/api/awardco/reward` - Send direct rewards
- `/api/awardco/balance` - Get user balance
- `/api/awardco/webhook` - Receive Awardco events

### ✅ React Components
- `<AwardcoBalance />` - Display user balance
- `<AwardActivityButton />` - Award points for activities

### ✅ Client Library
- `createAwardcoClient()` - Initialize Awardco client
- Full TypeScript support
- Webhook validation utilities

### ✅ Security
- Server-side API calls only
- HMAC-SHA256 webhook verification
- Timestamp validation
- API key protection

## Point System

| Activity | Points | When Awarded |
|----------|--------|--------------|
| Rent Payment | 50 | On-time monthly payment |
| Referral | 100 | Friend signs up |
| Profile Complete | 25 | 100% profile completion |
| Verification | 50 | ID verification |
| Review | 20 | Write property review |
| Maintenance | 15 | Report issue |

## Usage in Code

### Award Points
```typescript
import { AwardActivityButton } from '@/components/rewards/AwardActivityButton';

<AwardActivityButton
  activityType="rent_payment"
  points={50}
  label="Confirm Payment"
  onSuccess={() => refreshBalance()}
/>
```

### Show Balance
```typescript
import { AwardcoBalance } from '@/components/rewards/AwardcoBalance';

<AwardcoBalance />
```

## Monitoring

### Check Logs
```bash
# Vercel production logs
vercel logs --follow

# Local logs
npm run dev
```

### Dashboard Metrics
Monitor in Awardco Admin:
- Recognition sent
- Points awarded
- Redemptions
- User engagement

## Support

- 📖 Full docs: `AWARDCO_INTEGRATION.md`
- 🔗 API docs: https://api.awardco.com
- 🎯 Awardco support: support@awardco.com

---

**Status:** ✅ Ready for Production
**Last Updated:** December 23, 2025

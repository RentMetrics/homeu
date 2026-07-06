# HomeU Reward Algorithm & Model

## Overview

HomeU's reward system incentivizes positive tenant behavior through a points-based system integrated with Awardco. Tenants earn points for various activities and can redeem them for real rewards through the Awardco marketplace.

---

## 💰 Economics Model

### Revenue Allocation

**Per Rent Payment:**
- HomeU charges processing fee: ~3% of rent payment
- Reward allocation: **$1.00 per payment**
- Point conversion: **$1.00 = 100 points**

**Example:**
```
Rent: $1,500
Processing Fee (3%): $45
Reward Allocation: $1.00 (100 points)
HomeU Revenue: $44.00
```

### Point Value
- **1 point = $0.01 USD**
- **100 points = $1.00 USD**
- Points redeemable via Awardco for gift cards, merchandise, experiences

---

## 🎯 Point Earning Structure

### 1. **Sign-Up & Onboarding** (One-Time)

| Activity | Points | Cash Value | When Awarded |
|----------|--------|-----------|--------------|
| **Account Creation** | 50 | $0.50 | Immediate on sign-up |
| **Profile Completion** | 100 | $1.00 | 100% profile filled |
| **Identity Verification** | 150 | $1.50 | ID verified via Straddle |
| **Bank Account Link** | 100 | $1.00 | Payment method added |
| **Lease Upload** | 50 | $0.50 | Lease document uploaded |
| **Total Onboarding** | **450** | **$4.50** | Complete all steps |

**Rationale:** Front-load rewards to encourage complete onboarding and reduce drop-off rates.

### 2. **Rent Payments** (Recurring)

| Activity | Points | Cash Value | Frequency |
|----------|--------|-----------|-----------|
| **On-Time Payment** | 100 | $1.00 | Per payment |
| **Auto-Pay Enabled** | 25 | $0.25 | Monthly bonus |
| **Early Payment (5+ days)** | 25 | $0.25 | Per payment |
| **Payment Streak Bonuses** | Variable | Variable | See below |

**Payment Streak Bonuses:**
```
3 months on-time  → +50 points  ($0.50)
6 months on-time  → +150 points ($1.50)
12 months on-time → +300 points ($3.00)
24 months on-time → +600 points ($6.00)
```

**Annual Potential:** 12 payments × 100 = 1,200 base points + streaks = ~1,500-1,800 points/year

### 3. **Referrals** (Unlimited)

| Milestone | Points | Cash Value | Condition |
|-----------|--------|-----------|-----------|
| **Referral Sign-Up** | 100 | $1.00 | Friend creates account |
| **Referral Verification** | 150 | $1.50 | Friend completes verification |
| **Referral First Payment** | 250 | $2.50 | Friend makes 1st rent payment |
| **Total per Referral** | **500** | **$5.00** | Complete referral funnel |

**Bonus Structure:**
- 3 successful referrals: +200 bonus points
- 5 successful referrals: +500 bonus points
- 10 successful referrals: +1,500 bonus points

### 4. **Community Engagement** (Recurring)

| Activity | Points | Cash Value | Frequency |
|----------|--------|-----------|-----------|
| **Property Review** | 50 | $0.50 | Once per property |
| **Maintenance Report** | 25 | $0.25 | Per report |
| **Community Survey** | 30 | $0.30 | Quarterly |
| **Satisfaction Survey** | 40 | $0.40 | Annual |
| **App Review** | 100 | $1.00 | Once |

### 5. **Loyalty & Milestones** (One-Time/Annual)

| Achievement | Points | Cash Value | When Awarded |
|-------------|--------|-----------|--------------|
| **1 Year Tenant** | 500 | $5.00 | 12 months |
| **2 Year Tenant** | 1,000 | $10.00 | 24 months |
| **3 Year Tenant** | 2,000 | $20.00 | 36 months |
| **Lease Renewal** | 300 | $3.00 | Per renewal |
| **Perfect Payment Year** | 500 | $5.00 | 12 on-time payments |

### 6. **Special Promotions** (Seasonal)

| Event | Points | Cash Value | Timing |
|-------|--------|-----------|--------|
| **Birthday Month** | 100 | $1.00 | Annual |
| **Holiday Bonus** | 150 | $1.50 | Dec/Jan |
| **Move-In Anniversary** | 200 | $2.00 | Annual |
| **Summer Promo** | Variable | Variable | Seasonal |

---

## 📊 Earning Potential

### Year 1 Tenant (Example)

| Source | Points | Value |
|--------|--------|-------|
| Onboarding | 450 | $4.50 |
| 12 Rent Payments | 1,200 | $12.00 |
| 6-month Streak | 150 | $1.50 |
| 12-month Streak | 300 | $3.00 |
| 1 Year Milestone | 500 | $5.00 |
| 2 Referrals | 1,000 | $10.00 |
| Engagement (avg) | 200 | $2.00 |
| **Total Year 1** | **3,800** | **$38.00** |

### Year 2 Tenant (Example)

| Source | Points | Value |
|--------|--------|-------|
| 12 Rent Payments | 1,200 | $12.00 |
| 24-month Streak | 600 | $6.00 |
| 2 Year Milestone | 1,000 | $10.00 |
| Lease Renewal | 300 | $3.00 |
| Engagement | 200 | $2.00 |
| **Total Year 2** | **3,300** | **$33.00** |

### Power User (High Engagement)

| Source | Points | Value |
|--------|--------|-------|
| Base Year 1 | 3,800 | $38.00 |
| 5 Referrals (+bonus) | 3,000 | $30.00 |
| All Engagement | 500 | $5.00 |
| Auto-pay Bonus (12mo) | 300 | $3.00 |
| **Total** | **7,600** | **$76.00** |

---

## 🔄 Point Lifecycle

### Earning Points

```
User Action → Validation → Point Award → Convex Update → Awardco Sync → User Notification
```

### Redemption Flow

```
User Browses Awardco → Selects Reward → Points Deducted → Order Placed → Fulfillment → Confirmation
```

### Point Expiration

**Policy:**
- Points valid for **24 months** from earning date
- Warning email at 90 days before expiration
- Expired points removed monthly
- No expiration for points earned from rent payments

---

## 🗄️ Database Schema

### Point Transactions Table

```typescript
{
  _id: Id<"pointTransactions">,
  userId: string,                    // Clerk user ID
  type: "earn" | "redeem" | "expire" | "bonus" | "adjustment",
  category: "rent" | "referral" | "signup" | "milestone" | "engagement",
  amount: number,                    // Positive for earn, negative for redeem
  balance: number,                   // Balance after transaction
  description: string,               // Human-readable description
  metadata: {
    rentPaymentId?: string,          // Link to payment
    referralUserId?: string,         // Link to referral
    streakMonths?: number,           // Streak milestone
    redemptionId?: string,           // Awardco redemption ID
    campaignId?: string,             // Promotion campaign
  },
  awardcoSynced: boolean,           // Synced with Awardco
  awardcoRecognitionId?: string,    // Awardco recognition ID
  expiresAt?: number,               // Expiration timestamp
  status: "pending" | "completed" | "failed" | "expired",
  createdAt: number,
  updatedAt: number,
}
```

### User Points Summary Table

```typescript
{
  _id: Id<"userPoints">,
  userId: string,                    // Clerk user ID
  totalEarned: number,               // Lifetime points earned
  totalRedeemed: number,             // Lifetime points redeemed
  currentBalance: number,            // Available points
  expiringPoints: number,            // Points expiring in 90 days
  lastEarnedAt: number,             // Last point earning date
  lastRedeemedAt?: number,          // Last redemption date
  streakCount: number,               // Current on-time payment streak
  longestStreak: number,            // Best streak record
  referralCount: number,            // Successful referrals
  tier: "bronze" | "silver" | "gold" | "platinum",
  metadata: {
    onboardingComplete: boolean,
    verificationComplete: boolean,
    bankLinked: boolean,
    leaseUploaded: boolean,
    autoPayEnabled: boolean,
    firstPaymentDate?: number,
    lastPaymentDate?: number,
  },
  updatedAt: number,
}
```

### Referral Tracking Table

```typescript
{
  _id: Id<"referrals">,
  referrerId: string,               // User who referred
  referredUserId: string,           // New user
  referredEmail: string,            // Email used
  status: "pending" | "signed_up" | "verified" | "paid" | "completed",
  pointsAwarded: number,            // Total points given
  milestones: {
    signUp: { completed: boolean, points: number, date?: number },
    verification: { completed: boolean, points: number, date?: number },
    firstPayment: { completed: boolean, points: number, date?: number },
  },
  createdAt: number,
  completedAt?: number,
}
```

### Payment Streak Table

```typescript
{
  _id: Id<"paymentStreaks">,
  userId: string,
  currentStreak: number,            // Consecutive on-time payments
  longestStreak: number,            // Best streak
  lastPaymentDate: number,          // Last payment timestamp
  streakStartDate: number,          // Current streak start
  missedPayments: number,           // Lifetime missed payments
  streakBonuses: Array<{
    months: number,
    points: number,
    awardedAt: number,
  }>,
  updatedAt: number,
}
```

---

## 🎮 Gamification Elements

### Tier System

| Tier | Points Required | Benefits |
|------|----------------|----------|
| **Bronze** | 0 - 999 | Standard earning rates |
| **Silver** | 1,000 - 2,999 | +5% bonus on rent payments |
| **Gold** | 3,000 - 6,999 | +10% bonus + priority support |
| **Platinum** | 7,000+ | +15% bonus + exclusive rewards |

### Badges & Achievements

```typescript
{
  "early_bird": "5 early rent payments",
  "perfect_year": "12 on-time payments",
  "referral_master": "5 successful referrals",
  "community_champion": "10 engagement activities",
  "loyal_tenant": "24 consecutive months",
  "super_saver": "10,000 points earned",
}
```

### Leaderboards

- **Monthly:** Top earners (resets monthly)
- **Quarterly:** Top referrers
- **Annual:** Most engaged tenants
- **All-Time:** Highest point totals

---

## 🔐 Fraud Prevention

### Validation Rules

1. **Payment Verification**
   - Confirm payment processed before awarding points
   - Verify payment amount and date
   - Check for refunds/chargebacks

2. **Referral Validation**
   - Unique email addresses only
   - Referred user must complete verification
   - First payment required for full bonus
   - No self-referrals (email/IP checks)

3. **Rate Limiting**
   - Max 1 profile completion per user
   - Max 1 sign-up bonus per device
   - Review activity throttling

4. **Audit Trail**
   - All point transactions logged
   - Admin review for bulk awards
   - Automatic flagging for suspicious activity

---

## 📈 Business Metrics

### KPIs to Track

1. **Engagement Metrics**
   - Average points per user
   - Redemption rate
   - Active users (earning points)

2. **Retention Metrics**
   - Payment streak completion rate
   - Tenant renewal correlation
   - Churn rate by point balance

3. **Financial Metrics**
   - Cost per point issued
   - Redemption value
   - ROI on reward program

4. **Growth Metrics**
   - Referral conversion rate
   - Viral coefficient
   - Onboarding completion rate

---

## 🎯 Success Metrics

### Program Goals

**Year 1 Targets:**
- 80% of users complete onboarding
- 60% achieve 3-month payment streak
- 30% make at least 1 referral
- 40% redeem points within 6 months
- 20% improvement in on-time payment rate

**ROI Targets:**
- Customer acquisition cost reduction: 25%
- Tenant retention increase: 15%
- Payment processing fee revenue: $44/payment
- Average reward cost: $1/payment
- Net benefit: $43/payment

---

## 💡 Implementation Recommendations

### Phase 1: Launch (Month 1-2)
- Basic point earning (rent, onboarding)
- Simple redemption via Awardco
- User dashboard display
- Admin monitoring

### Phase 2: Growth (Month 3-4)
- Referral system
- Streak bonuses
- Email notifications
- Mobile app integration

### Phase 3: Optimization (Month 5-6)
- Tier system
- Badges/achievements
- Leaderboards
- Advanced analytics

### Phase 4: Scale (Month 7+)
- Partnerships (local businesses)
- Custom rewards
- Seasonal campaigns
- API for property managers

---

## 🔄 Point Adjustment Policies

### Admin Adjustments

**Allowed Scenarios:**
- Customer service recovery
- System errors/bugs
- Promotional campaigns
- Dispute resolution

**Approval Requirements:**
- Manager approval for >500 points
- Executive approval for >2,000 points
- All adjustments logged with reason

### Point Reversals

**Valid Reasons:**
- Payment refund/chargeback
- Fraudulent activity detected
- Duplicate awards
- User request (redemption cancel)

---

**Algorithm Version:** 1.0.0
**Last Updated:** December 23, 2025
**Status:** Ready for Implementation

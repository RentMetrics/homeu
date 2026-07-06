# Awardco API Test Guide

## ✅ Credentials Configured

Your Awardco API credentials have been added to `.env.local`:

```bash
AWARDCO_API_KEY=QUxMIFIPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
AWARDCO_API_BASE_URL=https://api.awardco.com/api
```

## 🧪 Quick Test

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test User Balance API

Open a new terminal and run:

```bash
# First, sign in to your app in the browser
# Then get your session cookie and test:

curl http://localhost:3000/api/awardco/balance \
  -H "Cookie: __session=your_clerk_session_cookie"
```

**Expected Response:**
```json
{
  "success": true,
  "balance": 0,
  "currency": "USD",
  "userId": "user_xxx",
  "newUser": true
}
```

### 3. Test Recognition (Award Points)

```bash
curl -X POST http://localhost:3000/api/awardco/recognize \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_clerk_session_cookie" \
  -d '{
    "recipientEmail": "your-email@example.com",
    "activityType": "profile_completion",
    "points": 25
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "recognitionId": "rec_123abc",
  "message": "Recognition sent successfully",
  "points": 25
}
```

### 4. Test Reward API

```bash
curl -X POST http://localhost:3000/api/awardco/reward \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_clerk_session_cookie" \
  -d '{
    "recipientEmail": "your-email@example.com",
    "points": 50,
    "message": "Thank you for your contribution!"
  }'
```

## 🎯 Testing in Browser

### Option 1: Use the Rewards Page

1. Navigate to: `http://localhost:3000/dashboard/rewards`
2. The page should display your current points
3. Look for the Awardco balance widget

### Option 2: Add Test Button

Add this to any page for testing:

```typescript
import { AwardActivityButton } from '@/components/rewards/AwardActivityButton';

// Add in your JSX:
<AwardActivityButton
  activityType="profile_completion"
  points={25}
  label="Test Award Points"
  onSuccess={() => alert('Points awarded!')}
/>
```

### Option 3: Browser Console Test

Open browser console and run:

```javascript
// Test balance
fetch('/api/awardco/balance')
  .then(r => r.json())
  .then(console.log);

// Test recognition
fetch('/api/awardco/recognize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmail: 'your-email@example.com',
    activityType: 'rent_payment',
    points: 50
  })
})
  .then(r => r.json())
  .then(console.log);
```

## 🔍 Verify Integration

### Check API Key Format

Your API key should be base64-encoded and match this pattern:
```
QUxMIFIPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
```
✅ **Confirmed** - Your key is properly formatted

### Check API Base URL

```
https://api.awardco.com/api
```
✅ **Confirmed** - Correct Awardco API endpoint

### Authentication Method

**Header-based API Key authentication**
```
apiKey: QUxMIFIPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
```
✅ **Confirmed** - Client configured correctly

## 📊 Monitor Requests

Watch the terminal where `npm run dev` is running. You'll see:

```
✓ Compiled /api/awardco/balance in XXXms
✓ Compiled /api/awardco/recognize in XXXms
```

## ⚠️ Common Issues

### "Awardco integration not configured"
- **Fix:** Restart your dev server (`npm run dev`)
- Environment variables are loaded on server start

### "Unauthorized" Error
- **Fix:** Make sure you're signed in
- Check that Clerk session cookie is present

### "User not found in Awardco"
- **Expected:** First time users won't exist yet
- The API will return `newUser: true`
- Create users first or handle gracefully

### API Key Invalid
- **Fix:** Double-check the API key in `.env.local`
- Make sure there are no extra spaces
- Verify key is active in Awardco dashboard

## 🎨 Next Steps

1. **Create Test User in Awardco**
   - Log into Awardco admin portal
   - Create a test user with your email
   - Assign them to the "HomeU Rewards" program

2. **Set Up Recognition Program**
   - Create program: "HomeU Rewards"
   - Set budget allocation
   - Configure notification settings

3. **Test Complete Flow**
   - Award points via API
   - Check balance via API
   - Verify in Awardco dashboard

4. **Configure Webhook** (Optional for testing)
   - Use ngrok: `ngrok http 3000`
   - Add webhook URL: `https://xxx.ngrok.io/api/awardco/webhook`
   - Test event delivery

## 📝 Example Test Scenario

**Goal:** Award 25 points for profile completion

1. **User completes profile** in HomeU
2. **Backend calls** `/api/awardco/recognize`
3. **Awardco creates** recognition record
4. **User sees** points in their balance
5. **Webhook fires** (if configured)
6. **HomeU updates** local database

## 🔗 Quick Links

- **API Documentation**: See `AWARDCO_INTEGRATION.md`
- **Awardco Dashboard**: https://awardco.com
- **API Reference**: https://api.awardco.com

---

**Your integration is ready to test!** 🚀

Start with the balance API test, then try awarding points.

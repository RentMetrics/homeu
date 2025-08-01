# Straddle Integration for HomeU

This document outlines the implementation of Straddle API integration for resident verification and bank account payments in the HomeU application.

## Overview

The Straddle integration provides two main functionalities:

1. **Resident Verification**: Using Straddle's Identity service for KYC and verification
2. **Bank Account Payments**: Using Straddle's Bridge widget and Pay by Bank functionality for rent payments

## Features

### ✅ Resident Verification
- Complete KYC verification through Straddle Identity
- Document upload and verification
- Real-time verification status updates
- Verification badge with HomeU house logo and star
- Integration with existing user verification system

### ✅ Bank Account Connection
- Secure bank account connection via Straddle Bridge
- Support for multiple bank accounts per user
- Real-time connection status monitoring
- PayKey generation for secure payments

### ✅ Rent Payments
- Direct bank-to-bank rent payments
- Real-time payment processing
- Built-in fraud protection and balance verification
- Payment history tracking
- No processing fees for bank transfers

## Architecture

### API Structure
```
/api/straddle/
├── verification/     # Resident verification endpoints
├── bank-connection/  # Bank account connection endpoints
└── payments/         # Payment processing endpoints
```

### Database Schema Updates
- Added `straddleCustomerId` to User model
- Added `straddlePaymentId` and `metadata` to Payment model
- Enhanced verification tracking

### Components
- `StraddleVerificationForm`: Complete verification form
- `StraddleBankConnection`: Bank account connection interface
- `StraddlePaymentForm`: Payment processing form
- `VerificationBadge`: Visual verification indicator

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env` file:
```bash
# Straddle API Configuration
STRADDLE_API_KEY=your_straddle_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (if not already configured)
DATABASE_URL=your_database_url_here
```

### 2. Database Migration
Run the Prisma migration to add Straddle-related fields:
```bash
npx prisma migrate dev --name add-straddle-integration
```

### 3. API Key Configuration
1. Sign up for a Straddle account at https://straddle.io
2. Navigate to Developers > API Keys in your Straddle Dashboard
3. Generate a new API key
4. Add the key to your environment variables

## Usage

### Resident Verification Flow

1. **User Registration**: User creates account in HomeU
2. **Verification Initiation**: User navigates to `/verify` page
3. **Document Submission**: User fills out verification form and uploads documents
4. **Straddle Processing**: Documents sent to Straddle for KYC verification
5. **Status Updates**: Real-time verification status updates
6. **Verification Complete**: User receives verification badge

```typescript
// Example: Submit verification
const response = await fetch('/api/straddle/verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    address: { /* address details */ },
    phone: '(555) 123-4567',
    documents: { /* base64 encoded documents */ }
  })
});
```

### Bank Account Connection Flow

1. **Verification Check**: User must be verified before connecting bank
2. **Connection Initiation**: User clicks "Connect Bank Account"
3. **Straddle Bridge**: Opens Straddle's Bridge widget in popup
4. **Bank Selection**: User selects and authenticates with their bank
5. **Connection Complete**: Bank account connected and PayKey generated
6. **Account Management**: User can view and manage connected accounts

```typescript
// Example: Connect bank account
const response = await fetch('/api/straddle/bank-connection', {
  method: 'POST'
});

const { connectionUrl } = await response.json();
// Open connectionUrl in popup window
```

### Payment Processing Flow

1. **Payment Initiation**: User selects property and enters payment amount
2. **Bank Account Selection**: User chooses connected bank account
3. **Payment Processing**: Payment sent through Straddle's Pay by Bank
4. **Real-time Updates**: Payment status updated in real-time
5. **Confirmation**: Payment confirmation and receipt generation

```typescript
// Example: Process payment
const response = await fetch('/api/straddle/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1500.00,
    currency: 'USD',
    description: 'Rent payment for March 2024',
    paykey: 'straddle_paykey_here',
    propertyId: 'property_id_here'
  })
});
```

## Security Features

### Data Protection
- All API communications use HTTPS
- Sensitive data encrypted in transit and at rest
- API keys stored securely in environment variables
- User authentication required for all operations

### Fraud Prevention
- Straddle's built-in fraud detection
- Real-time balance verification
- Multi-dimensional risk assessment
- Watchlist screening integration

### Compliance
- KYC compliance through Straddle Identity
- Bank-level security standards
- PCI DSS compliance for payment processing
- GDPR-compliant data handling

## Error Handling

### Common Error Scenarios
1. **API Key Issues**: Invalid or expired API key
2. **Network Errors**: Connection timeouts or failures
3. **Verification Failures**: Document rejection or KYC failures
4. **Payment Failures**: Insufficient funds or bank errors
5. **Connection Issues**: Bank authentication failures

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

## Testing

### Sandbox Environment
- Use Straddle sandbox for development and testing
- Test with sandbox API keys
- Mock bank accounts available for testing
- Test verification with sample documents

### Production Environment
- Switch to production API keys for live deployment
- Real bank connections and payments
- Live verification processing
- Production-grade security and compliance

## Monitoring and Analytics

### Key Metrics
- Verification success rates
- Payment processing times
- Bank connection success rates
- Error rates and types
- User engagement with verification/payment features

### Logging
- All API calls logged for debugging
- Payment transaction logs
- Verification status changes
- Error logs with detailed context

## Troubleshooting

### Common Issues

1. **Verification Not Processing**
   - Check API key validity
   - Verify document format and size
   - Ensure all required fields are provided

2. **Bank Connection Fails**
   - Verify user verification status
   - Check popup blocker settings
   - Ensure proper return URLs configured

3. **Payment Processing Errors**
   - Verify PayKey validity
   - Check account balance
   - Ensure proper payment amount format

### Support Resources
- Straddle API Documentation: https://docs.straddle.io
- Straddle Support: support@straddle.io
- HomeU Development Team: dev@homeu.com

## Future Enhancements

### Planned Features
- Automated recurring payments
- Payment scheduling
- Multiple currency support
- Advanced fraud detection
- Mobile app integration
- Webhook notifications

### Integration Opportunities
- Property management system integration
- Accounting software integration
- Tenant screening services
- Insurance verification
- Credit reporting integration

## Conclusion

The Straddle integration provides HomeU with a robust, secure, and compliant solution for resident verification and rent payments. The implementation follows industry best practices and provides a seamless user experience while maintaining the highest security standards.

For questions or support, please contact the development team or refer to the Straddle API documentation. 
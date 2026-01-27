# Subscription System Implementation Guide

## Overview
This document outlines the recommended approach for implementing an annual subscription-based system for the Barangay Management Information System.

## Architecture Recommendations

### 1. Multi-Tenant Architecture
Since each barangay is a separate client, implement a multi-tenant system:

**Option A: Organization/Tenant Model (Recommended)**
- Each barangay becomes an "Organization" or "Tenant"
- All users belong to an organization
- All data is scoped to organizations
- Subscription is tied to the organization

**Option B: Single Tenant with Subscription Tiers**
- Keep current single-tenant structure
- Add subscription status to User model
- Simpler but less scalable

### 2. Database Schema Changes

#### New Models Needed:

```prisma
// Organization/Tenant Model
model Organization {
  id              String    @id @default(uuid())
  name            String    // Barangay name
  code            String    @unique // Unique barangay code
  address         String?
  contactEmail    String?
  contactPhone    String?
  logo            String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  users           User[]
  subscription    Subscription?
  residents       Resident[]
  households      Household[]
  // ... other relations

  @@map("organizations")
}

// Subscription Plans
model SubscriptionPlan {
  id              String    @id @default(uuid())
  name            String    // e.g., "Basic", "Professional", "Enterprise"
  description     String?   @db.Text
  price           Decimal   @db.Decimal(10, 2) // Annual price
  billingCycle    String    @default("ANNUAL") // ANNUAL, MONTHLY
  features        Json      // Feature flags and limits
  maxUsers        Int?
  maxResidents    Int?
  maxStorage      Int?      // in MB
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  subscriptions   Subscription[]

  @@map("subscription_plans")
}

// Subscriptions
model Subscription {
  id              String    @id @default(uuid())
  organizationId  String    @unique @map("organization_id")
  planId          String    @map("plan_id")
  status          SubscriptionStatus @default(TRIAL)
  currentPeriodStart DateTime @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")
  cancelAtPeriodEnd   Boolean @default(false) @map("cancel_at_period_end")
  trialEndsAt     DateTime? @map("trial_ends_at")
  
  // Payment info
  paymentMethod   String?   @map("payment_method") // STRIPE, PAYPAL, BANK_TRANSFER
  paymentId       String?    @map("payment_id") // External payment ID
  lastPaymentDate DateTime? @map("last_payment_date")
  nextBillingDate DateTime? @map("next_billing_date")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])
  payments        Payment[]

  @@map("subscriptions")
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
  SUSPENDED
}

// Payment Records
model Payment {
  id              String    @id @default(uuid())
  subscriptionId  String    @map("subscription_id")
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("PHP")
  status          PaymentStatus @default(PENDING)
  paymentMethod   String    @map("payment_method")
  transactionId   String?   @unique @map("transaction_id")
  receiptUrl      String?   @map("receipt_url")
  paidAt          DateTime? @map("paid_at")
  createdAt       DateTime  @default(now())

  subscription    Subscription @relation(fields: [subscriptionId], references: [id])

  @@index([subscriptionId])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// Update User model
model User {
  // ... existing fields
  organizationId  String?   @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

### 3. Subscription Plans Structure

#### Recommended Plans:

**Basic Plan (₱12,000/year)**
- Up to 500 residents
- Up to 5 users
- 1GB storage
- Core features only
- Email support

**Professional Plan (₱24,000/year)**
- Up to 2,000 residents
- Up to 15 users
- 5GB storage
- All features
- Priority support
- Advanced reporting

**Enterprise Plan (₱48,000/year)**
- Unlimited residents
- Unlimited users
- 20GB storage
- All features
- Dedicated support
- Custom integrations
- API access

### 4. Payment Integration Options

#### Option 1: Stripe (Recommended for International)
- **Pros**: Global, supports recurring payments, webhooks, good documentation
- **Cons**: Requires international setup, fees
- **Best for**: If targeting international clients or need robust payment handling

#### Option 2: PayPal
- **Pros**: Widely accepted, supports recurring payments
- **Cons**: Higher fees, less developer-friendly
- **Best for**: Quick implementation, international clients

#### Option 3: Local Payment Gateways (Philippines)
- **GCash Pay** - Popular mobile wallet
- **PayMaya** - Another mobile wallet option
- **Dragonpay** - Local payment aggregator
- **Pros**: Lower fees, local currency, familiar to Filipino users
- **Cons**: May require more integration work

#### Option 4: Bank Transfer + Manual Verification
- **Pros**: No payment gateway fees, full control
- **Cons**: Manual work, delayed activation
- **Best for**: Starting out, B2B sales

### 5. Implementation Steps

#### Phase 1: Foundation (Week 1-2)
1. Add Organization model to schema
2. Migrate existing data to default organization
3. Update User model with organizationId
4. Add subscription middleware
5. Create subscription status checks

#### Phase 2: Subscription Management (Week 3-4)
1. Create subscription plans in database
2. Build subscription management UI
3. Implement subscription status page
4. Add subscription activation/deactivation
5. Create payment recording system

#### Phase 3: Payment Integration (Week 5-6)
1. Choose payment gateway
2. Implement payment processing
3. Set up webhooks for payment events
4. Create invoice generation
5. Add payment history tracking

#### Phase 4: Feature Gating (Week 7-8)
1. Create feature flag system
2. Add usage limits checking
3. Implement access restrictions
4. Create upgrade prompts
5. Add usage dashboards

#### Phase 5: Automation (Week 9-10)
1. Set up renewal reminders
2. Implement auto-renewal
3. Create expiration handling
4. Add trial period management
5. Set up email notifications

### 6. Code Structure Recommendations

#### Backend Structure:
```
backend/src/
├── controllers/
│   ├── subscription.controller.ts
│   ├── payment.controller.ts
│   └── organization.controller.ts
├── middleware/
│   ├── subscription.middleware.ts  // Check subscription status
│   └── feature-gate.middleware.ts  // Check feature access
├── services/
│   ├── payment.service.ts          // Payment processing
│   ├── subscription.service.ts     // Subscription logic
│   └── email.service.ts            // Subscription emails
└── routes/
    ├── subscription.routes.ts
    └── payment.routes.ts
```

#### Frontend Structure:
```
frontend/app/
├── subscription/
│   ├── page.tsx                    // Subscription management
│   ├── plans/
│   │   └── page.tsx                 // Pricing page
│   └── billing/
│       └── page.tsx                 // Billing history
└── components/
    ├── SubscriptionBanner.tsx       // Upgrade prompts
    └── UsageLimits.tsx              // Usage indicators
```

### 7. Key Features to Implement

#### Subscription Management:
- View current plan and status
- Upgrade/downgrade plans
- Cancel subscription (with grace period)
- View billing history
- Download invoices
- Update payment method

#### Usage Tracking:
- Resident count vs limit
- User count vs limit
- Storage usage
- Feature usage statistics

#### Notifications:
- Trial ending (7 days, 3 days, 1 day)
- Payment due reminders
- Payment success/failure
- Subscription expiration
- Upgrade recommendations

### 8. Security Considerations

1. **Payment Security**: Never store full payment details, use tokens
2. **Subscription Validation**: Always verify subscription status server-side
3. **Rate Limiting**: Prevent abuse of free/trial features
4. **Data Isolation**: Ensure proper tenant data isolation
5. **Audit Logging**: Track all subscription changes

### 9. Migration Strategy

1. **Create default organization** for existing data
2. **Assign all users** to default organization
3. **Create default subscription** (trial or active)
4. **Gradually migrate** to multi-tenant queries
5. **Test thoroughly** before going live

### 10. Monitoring & Analytics

Track:
- Subscription conversion rates
- Churn rate
- Average revenue per user (ARPU)
- Feature usage by plan
- Payment success rates
- Trial-to-paid conversion

### 11. Legal & Compliance

- Terms of Service
- Privacy Policy
- Refund Policy
- Data retention policies
- BIR compliance (for Philippines)
- Data protection (GDPR if international)

## Quick Start Implementation

### Step 1: Update Prisma Schema
Add the subscription models to your schema.prisma file

### Step 2: Create Migration
```bash
cd backend
npx prisma migrate dev --name add_subscription_system
```

### Step 3: Seed Subscription Plans
Create a seed script to populate initial plans

### Step 4: Update Middleware
Add subscription checking to protected routes

### Step 5: Build UI
Create subscription management pages

## Recommended Payment Gateway for Philippines

For Philippine clients, consider:
1. **Stripe** - If you want international support
2. **PayMongo** - Philippine-based, Stripe-like API
3. **Dragonpay** - Local aggregator, supports many payment methods
4. **Manual Bank Transfer** - Start simple, automate later

## Next Steps

1. Review and approve this architecture
2. Choose payment gateway
3. Set subscription pricing
4. Create implementation timeline
5. Begin Phase 1 implementation


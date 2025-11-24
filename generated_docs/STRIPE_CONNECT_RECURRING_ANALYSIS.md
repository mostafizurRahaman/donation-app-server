# Stripe Connect Integration: One-Time vs Recurring Donations

## Analysis Summary

**YES, recurring donations MUST implement the same Stripe Connect flow as one-time donations.**

---

## One-Time Donation Flow (Current Implementation)

### Payment Flow
```javascript
// 1. Get organization's Stripe Connect account
const connectedAccountId = organization.stripeConnectAccountId;

if (!connectedAccountId) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    'This organization has not set up payment receiving.'
  );
}

// 2. Create Payment Intent with transfer_data
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: 'usd',
  customer: stripeCustomerId,
  payment_method: paymentMethodId,
  confirm: true,
  // 👇 KEY: Transfer funds to organization's connected account
  transfer_data: {
    destination: connectedAccountId,
  },
  metadata: { ... }
});

// 3. Save Donation record with connectedAccountId
const donation = await Donation.create({
  ...otherFields,
  connectedAccountId, // ✅ Stored for tracking
  stripePaymentIntentId: paymentIntent.id,
  status: 'completed'
});
```

### Key Components

1. **Organization Model** (`organization.model.ts`):
   ```javascript
   {
     stripeConnectAccountId: String // Required for receiving payments
   }
   ```

2. **Donation Model** (`donation.model.ts`):
   ```javascript
   {
     connectedAccountId: String // Tracks which org account received funds
   }
   ```

3. **Stripe PaymentIntent** with `transfer_data`:
   - Platform charges the donor
   - Funds automatically transferred to organization's connected account
   - Platform can take application fees (if configured)

---

## Recurring Donation Flow (Updated Implementation)

### What Changed

**BEFORE** (Missing Stripe Connect):
```javascript
// ❌ No connectedAccountId check
// ❌ No transfer_data in PaymentIntent
// ❌ Funds go to platform account, not organization

const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,
  currency: 'usd',
  customer: stripeCustomerId,
  payment_method: paymentMethodId,
  confirm: true,
  // ❌ Missing transfer_data - funds stuck in platform account!
});
```

**AFTER** (With Stripe Connect):
```javascript
// ✅ Get organization's connected account
const organization = scheduledDonation.organization as any;
const connectedAccountId = organization.stripeConnectAccountId;

if (!connectedAccountId) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Organization has not set up payment receiving. Scheduled donation paused.`
  );
}

// ✅ Create PaymentIntent with transfer to organization
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(scheduledDonation.amount * 100),
  currency: scheduledDonation.currency.toLowerCase(),
  customer: scheduledDonation.stripeCustomerId,
  payment_method: scheduledDonation.paymentMethodId,
  confirm: true,
  off_session: true, // Important for recurring
  // ✅ Transfer funds to organization's connected account
  transfer_data: {
    destination: connectedAccountId,
  },
  metadata: {
    scheduledDonationId: scheduledDonationId,
    donationType: 'recurring',
    ...
  }
});

// ✅ Save Donation with connectedAccountId
const donation = await Donation.create({
  ...otherFields,
  connectedAccountId, // ✅ Track which org received funds
  scheduledDonationId: scheduledDonation._id,
});
```

---

## Why Stripe Connect is Critical

### Without Stripe Connect
❌ **Funds go to platform's Stripe account**
❌ **Organizations don't receive money automatically**
❌ **Manual payouts required** (complex, error-prone)
❌ **No audit trail** of where funds went
❌ **Cannot track organization-specific transactions**

### With Stripe Connect
✅ **Funds automatically transferred to organization**
✅ **Real-time payment distribution**
✅ **Clear audit trail** via `connectedAccountId`
✅ **Organization can manage their own funds**
✅ **Platform can take application fees** (if needed)
✅ **Compliance-friendly** (organizations control their funds)

---

## Key Differences: One-Time vs Recurring

| Aspect | One-Time Donation | Recurring Donation |
|--------|-------------------|-------------------|
| **Payment Trigger** | User initiates | Cron job executes |
| **User Present** | Yes (on-session) | No (off-session) |
| **Stripe Flag** | `confirm: true` | `confirm: true, off_session: true` |
| **Payment Method** | Saved & confirmed | Pre-authorized for recurring use |
| **Stripe Connect** | ✅ Required | ✅ Required (NOW ADDED) |
| **transfer_data** | ✅ Included | ✅ Included (NOW ADDED) |
| **connectedAccountId** | ✅ Stored | ✅ Stored (NOW ADDED) |

---

## Implementation Details

### Changes Made to `scheduledDonation.service.ts`

#### 1. Added Connected Account Validation
```javascript
// Get organization's Stripe Connect account (required for receiving payments)
const organization = scheduledDonation.organization as any;
const connectedAccountId = organization.stripeConnectAccountId;

if (!connectedAccountId) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Organization "${organization.name}" has not set up payment receiving. Scheduled donation paused.`
  );
}
```

**Impact**: 
- Prevents creating donations if organization can't receive payments
- Provides clear error message
- Pauses scheduled donation execution

#### 2. Added `transfer_data` to PaymentIntent
```javascript
const paymentIntentParams: any = {
  amount: Math.round(scheduledDonation.amount * 100),
  currency: scheduledDonation.currency.toLowerCase(),
  customer: scheduledDonation.stripeCustomerId,
  payment_method: scheduledDonation.paymentMethodId,
  confirm: true,
  off_session: true, // ✅ Critical for recurring payments
  // ✅ Transfer funds to organization's connected account
  transfer_data: {
    destination: connectedAccountId,
  },
  metadata: { ... },
};
```

**Impact**:
- Funds automatically transferred to organization
- Same flow as one-time donations
- Consistent payment distribution

#### 3. Added `connectedAccountId` to Donation Records
```javascript
// Success case
const donation = await Donation.create({
  ...otherFields,
  connectedAccountId, // ✅ Organization's Stripe Connect account
  scheduledDonationId: scheduledDonation._id,
});

// Failure case (for audit trail)
const failedDonation = await Donation.create({
  ...otherFields,
  status: 'failed',
  connectedAccountId, // ✅ Include even for failed donations
  scheduledDonationId: scheduledDonation._id,
});
```

**Impact**:
- Clear tracking of which organization received (or should have received) funds
- Audit trail for all donation attempts
- Supports reporting and analytics

---

## Stripe Connect Setup Requirements

### For Organizations to Receive Payments

1. **Stripe Connect Onboarding**:
   ```javascript
   // Create account link for organization
   const accountLink = await stripe.accountLinks.create({
     account: organization.stripeConnectAccountId,
     refresh_url: 'https://yourapp.com/connect/refresh',
     return_url: 'https://yourapp.com/connect/return',
     type: 'account_onboarding',
   });
   ```

2. **Organization Must Complete**:
   - Business verification
   - Bank account connection
   - Tax information (if required)
   - Terms of service acceptance

3. **Validation Before Accepting Donations**:
   ```javascript
   if (!organization.stripeConnectAccountId) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       'This organization has not set up payment receiving.'
     );
   }
   ```

---

## Error Handling

### Scenario 1: Organization Hasn't Set Up Stripe Connect
```javascript
// During scheduled execution
if (!connectedAccountId) {
  // ❌ Throw error - scheduled donation will pause
  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Organization has not set up payment receiving. Scheduled donation paused.`
  );
}
```

**Result**: 
- Scheduled donation won't execute
- No failed charge to user
- Clear error message for logs/notifications
- Can resume once organization completes onboarding

### Scenario 2: Payment Fails
```javascript
try {
  const paymentIntent = await stripe.paymentIntents.create({ ... });
  // Create successful donation record
} catch (error) {
  // Create failed donation record with connectedAccountId
  const failedDonation = await Donation.create({
    status: 'failed',
    connectedAccountId, // ✅ Track attempted destination
    ...
  });
  
  // Don't update scheduled donation - will retry next time
  throw new AppError(...);
}
```

**Result**:
- Failed donation recorded for audit
- Scheduled donation will retry on next execution
- User may receive notification of failure

---

## Benefits of Consistent Implementation

### 1. **Unified Payment Distribution**
- All donations (one-time, recurring, round-up) go directly to organizations
- No manual intervention needed
- Real-time fund availability

### 2. **Clear Audit Trail**
- Every Donation record has `connectedAccountId`
- Can track all payments to specific organization
- Supports compliance and reporting

### 3. **Organization Independence**
- Organizations control their own funds
- Can withdraw to their bank accounts
- Platform doesn't hold donor money

### 4. **Simplified Accounting**
```javascript
// Get all donations to an organization
const donations = await Donation.find({
  connectedAccountId: organization.stripeConnectAccountId,
  status: 'completed'
});

// Calculate total funds received
const totalReceived = donations.reduce((sum, d) => sum + d.amount, 0);
```

### 5. **Application Fees (Optional)**
```javascript
// Platform can take fees if configured
transfer_data: {
  destination: connectedAccountId,
  amount: Math.round(amount * 100 * 0.95), // Keep 5% as fee
}
```

---

## Testing Checklist

### One-Time Donations
- [x] ✅ Organization has `stripeConnectAccountId`
- [x] ✅ PaymentIntent includes `transfer_data`
- [x] ✅ Donation record includes `connectedAccountId`
- [x] ✅ Funds appear in organization's Stripe account

### Recurring Donations
- [x] ✅ Organization has `stripeConnectAccountId`
- [x] ✅ PaymentIntent includes `transfer_data`
- [x] ✅ PaymentIntent has `off_session: true`
- [x] ✅ Donation record includes `connectedAccountId`
- [x] ✅ Failed donations still record `connectedAccountId`
- [x] ✅ Funds appear in organization's Stripe account
- [x] ✅ Scheduled donation pauses if org not set up

---

## Summary

### Before This Fix
```
Donor → Platform Stripe Account → ??? (manual payout needed)
                                    ❌ No automation
                                    ❌ Funds stuck
```

### After This Fix
```
Donor → Platform Stripe Account → Organization Connected Account
        ✅ Automatic transfer via Stripe Connect
        ✅ Real-time distribution
        ✅ Clear audit trail
```

**Recurring donations now have the SAME payment flow as one-time donations**, ensuring organizations receive funds automatically and consistently regardless of donation type.

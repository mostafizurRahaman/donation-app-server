# Recurring Donations - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Start the Server
```bash
npm run dev
```

**What happens:**
- ✅ Database connects
- ✅ Cron jobs initialize
- ✅ Server starts on configured port

**Check logs for:**
```
🔄 Scheduled Donations Cron Job initialized
✅ Scheduled Donations Cron Job started successfully
🚀 Server running on http://localhost:5000
```

---

### 2. Create a Scheduled Donation (User)

**Endpoint:**
```
POST /api/scheduled-donation
```

**Headers:**
```
Authorization: Bearer <user-token>
Content-Type: application/json
```

**Body:**
```json
{
  "organizationId": "65abc123...",
  "causeId": "65def456...",
  "amount": 50,
  "frequency": "monthly",
  "paymentMethodId": "pm_123456...",
  "specialMessage": "Monthly donation for education"
}
```

**Frequency options:**
- `"daily"` - Every day
- `"weekly"` - Every week
- `"monthly"` - Every month
- `"quarterly"` - Every 3 months
- `"yearly"` - Every year
- `"custom"` - Custom interval (requires `customInterval` field)

---

### 3. Test the Cron Job (Admin)

#### Option A: Wait for Automatic Execution
- Cron runs every hour at minute 0 (00:00, 01:00, etc.)
- Check logs for execution

#### Option B: Manual Trigger (Recommended for Testing)

**Endpoint:**
```
POST /api/admin/cron/scheduled-donations/trigger
```

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled donations processing completed",
  "data": {
    "success": true,
    "results": [
      {
        "success": true,
        "donationId": "65abc..."
      }
    ]
  }
}
```

---

### 4. Verify Execution

#### Check Scheduled Donation
```
GET /api/scheduled-donation/:id
```

**Verify:**
- `lastExecutedDate` updated
- `totalExecutions` incremented
- `nextDonationDate` calculated

#### Check Donation Record
```
GET /api/donation/:id
```

**Verify:**
- `donationType: "recurring"`
- `scheduledDonationId` references back
- `connectedAccountId` set
- `pointsEarned` = amount * 100
- `status: "completed"`

---

## 📊 Common Operations

### List User's Scheduled Donations
```
GET /api/scheduled-donation?page=1&limit=10&isActive=true
Authorization: Bearer <user-token>
```

### Update Amount/Frequency
```
PATCH /api/scheduled-donation/:id
Authorization: Bearer <user-token>

Body:
{
  "amount": 100,
  "frequency": "weekly"
}
```

### Pause Scheduled Donation
```
POST /api/scheduled-donation/:id/pause
Authorization: Bearer <user-token>
```

### Resume Scheduled Donation
```
POST /api/scheduled-donation/:id/resume
Authorization: Bearer <user-token>
```

### Cancel Scheduled Donation
```
DELETE /api/scheduled-donation/:id
Authorization: Bearer <user-token>
```

---

## 🔍 Monitoring

### Check Logs
```bash
# Watch server logs
npm run dev

# Look for:
🔄 Starting Scheduled Donations Execution
📊 Found X scheduled donation(s) due for execution
✅ Success! Created donation record: 65abc...
📊 Execution Summary
```

### Get Cron Status (Admin)
```
GET /api/admin/cron/status
Authorization: Bearer <admin-token>
```

---

## 🐛 Quick Troubleshooting

### Cron Not Running
```bash
# Check server logs on startup
# Should see:
🔄 Scheduled Donations Cron Job initialized
✅ Scheduled Donations Cron Job started successfully
```

### No Donations Processing
```bash
# Check if there are due donations
# In MongoDB:
db.scheduleddonations.find({
  isActive: true,
  nextDonationDate: { $lte: new Date() }
})
```

### Payment Failures
```bash
# Check logs for error messages:
❌ Failed to execute scheduled donation: 65abc123
   Error: Card declined

# Common issues:
# - Card declined/insufficient funds
# - Organization not set up (no stripeConnectAccountId)
# - Payment method expired
```

---

## 📝 Testing Checklist

- [ ] Create scheduled donation
- [ ] Manually trigger cron (admin endpoint)
- [ ] Verify donation created
- [ ] Check execution tracking updated
- [ ] Verify points earned (amount * 100)
- [ ] Check Stripe transfer to organization
- [ ] Test pause/resume
- [ ] Test cancel
- [ ] Test update amount/frequency

---

## 🔗 Quick Links

### Documentation
- [Complete Implementation](./IMPLEMENTATION_COMPLETE_SUMMARY.md)
- [Cron Job Details](./CRON_JOB_IMPLEMENTATION.md)
- [Stripe Connect Analysis](./STRIPE_CONNECT_RECURRING_ANALYSIS.md)
- [Minimal Approach](./SCHEDULED_DONATION_REFACTOR.md)

### Code Locations
- **Cron Job**: `src/app/jobs/scheduledDonations.job.ts`
- **Service**: `src/app/modules/ScheduledDonation/scheduledDonation.service.ts`
- **Routes**: `src/app/modules/ScheduledDonation/scheduledDonation.route.ts`
- **Admin Controls**: `src/app/modules/Admin/admin.cron.controller.ts`

---

## 💡 Pro Tips

1. **Test First**: Use manual trigger before relying on automatic cron
2. **Check Logs**: Always monitor logs during first few executions
3. **Stripe Test Mode**: Use Stripe test mode for development
4. **Set Due Date**: Set `nextDonationDate` to past for immediate execution
5. **Admin Access**: Keep admin credentials handy for manual triggers

---

## ✅ Success Indicators

### Cron Job Running
```
✅ Scheduled Donations Cron Job started successfully
```

### Processing Works
```
📊 Found 5 scheduled donation(s) due for execution
✅ Success! Created donation record: 65abc123
```

### Execution Summary
```
📊 Execution Summary
   Total Processed: 5
   ✅ Successful: 5
   ❌ Failed: 0
   ⏱️  Duration: 2.15s
```

---

## 🎯 Ready to Go!

You're all set! The recurring donations system is ready for use.

**Need help?** Check the detailed documentation files or review the code comments.

**Happy coding! 🚀**

# Feature 03: Payment Links via WhatsApp

## Status: ⏳ Planned

## Problem
Sellers share bank details manually in WhatsApp chats for payment collection. This is error-prone, unprofessional, and doesn't track payments. Payment completion rate for manual bank details is ~30%.

## Solution
One-click payment link generation from the order dashboard:
1. Seller clicks "Send Payment Link" on an order
2. System generates a PayFast payment URL with order details pre-filled
3. WhatsApp deep link opens with pre-filled message containing the payment link
4. Buyer clicks link → mobile-friendly PayFast checkout
5. Payment confirmed via ITN webhook → order auto-marked as paid

## Acceptance Criteria
- [ ] Payment link generated with correct amount and order reference
- [ ] WhatsApp message pre-filled with payment link + order summary
- [ ] Buyer can pay via card, EFT, or Instant EFT on PayFast
- [ ] ITN webhook processes payment → order moves to PAID status
- [ ] Payment link expires after 24 hours
- [ ] Duplicate payment prevention
- [ ] Seller notified when payment completes
- [ ] Works on mobile (full responsive checkout flow)

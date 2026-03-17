# Feature 02: Automated Order Reply Bot

## Status: ⏳ Planned

## Problem
Buyers message sellers on WhatsApp about order status, product availability, and pricing. Sellers must manually reply, often while working. Response delays lose sales — 53% of buyers abandon if they don't get a reply within 10 minutes.

## Solution
AI bot that automatically handles common buyer inquiries:
- **Order status**: "Where's my order TF-1234?" → bot checks DB, replies with status + tracking
- **Stock check**: "Do you have this in size M?" → bot checks variants, replies with availability
- **Payment**: "How do I pay?" → bot generates and sends payment link
- **Product info**: "How much is the red dress?" → bot replies with price + link

## Acceptance Criteria
- [ ] Bot detects intent from natural language message
- [ ] Order status lookup returns correct timeline
- [ ] Stock availability check is real-time from DB
- [ ] Payment links generated and sent correctly
- [ ] Bot operates 24/7 within configured hours
- [ ] Seller can take over conversation at any time
- [ ] Response time < 3 seconds
- [ ] Works in isiZulu, isiXhosa, Afrikaans, Sesotho, English

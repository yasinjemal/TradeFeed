# Feature 01: WhatsApp Product Import

## Status: 🚧 In Progress

## Problem
Sellers must use a web form to create products. Most SA WhatsApp sellers already photograph products and share them in WhatsApp groups/statuses. There's no way to turn these existing WhatsApp photos into structured product listings without manual re-entry.

## Solution
Allow sellers to create products by sending a WhatsApp message containing:
- **Photo** of the product
- **Price** (e.g., "R250" or "250")
- **Optional**: quantity, size range, color, description

The AI automatically:
1. Analyzes the image (GPT-4o Vision)
2. Generates product name and description
3. Detects category from image
4. Parses price from text
5. Creates product entry in the seller's store
6. Replies with confirmation + product link

## User Flow

```
1. Seller sends WhatsApp message to TradeFeed business number
2. Message contains: product photo + "Red dress R250 S-XL"
3. System receives via Meta Business API webhook
4. AI processes image → generates: name, description, category, tags
5. Parser extracts: price (R250), sizes (S, M, L, XL)
6. Product + variants created in seller's shop
7. Seller receives reply: "✅ Created: Red Bodycon Dress — R250. View: https://tradefeed.co.za/catalog/shop/products/xxx"
```

## Acceptance Criteria

- [ ] Seller can send a single photo + price text and get a product created
- [ ] AI generates a professional product name from the image
- [ ] AI generates a 100+ word description in the seller's language preference
- [ ] Price is correctly parsed from multiple formats (R250, 250, R 250.00, 250.00)
- [ ] Size range is parsed ("S-XL" → S, M, L, XL variants)
- [ ] Product appears in seller's catalog within 30 seconds
- [ ] Seller receives WhatsApp confirmation with product link
- [ ] Duplicate images are detected and flagged
- [ ] Errors produce helpful WhatsApp replies
- [ ] Rate limited: max 10 imports per hour per shop

## Technical Notes

See: `/docs/phasetrack.md` — Feature 1 for full technical implementation plan

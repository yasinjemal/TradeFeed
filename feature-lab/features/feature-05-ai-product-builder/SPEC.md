# Feature 05: AI Product Builder

## Status: ⏳ Planned

## Problem
Sellers with limited English or digital skills struggle to write product descriptions, choose categories, and optimize listings. Poor quality listings get less marketplace visibility and fewer sales.

## Solution
"AI Assist" button on the product creation form:
1. Seller uploads product image
2. Clicks "✨ AI Assist"
3. GPT-4o Vision analyzes image → generates name, description, category, tags
4. Fields auto-populate with generated content
5. Seller reviews, edits if needed, saves
6. Description generated in seller's preferred language

## Acceptance Criteria
- [ ] "AI Assist" button appears after image upload
- [ ] GPT-4o generates relevant product name from image
- [ ] Description: 150+ words, professional quality
- [ ] Category suggestion matches global category tree
- [ ] Tags auto-generated (5-10 relevant tags)
- [ ] Output language matches `SellerPreferences.languagePreference`
- [ ] Works in all 5 SA languages (en/zu/xh/af/st)
- [ ] Seller can edit all fields before saving
- [ ] Response time < 5 seconds
- [ ] Rate limit: 50 generations per day per shop

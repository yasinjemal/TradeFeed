# Feature 06: Marketplace Ranking Algorithm

## Status: ⏳ Planned

## Problem
Marketplace sorts by newest/trending/price. No quality-based ranking rewards good sellers. New sellers can game freshness by re-listing. Buyers waste time scrolling past low-quality listings to find trustworthy sellers.

## Solution
Quality-based ranking algorithm:
- **Product Quality Score** = f(views, orders, rating, freshness, seller_health)
- **Seller Health Score** = f(response_time, order_completion, return_rate, verification_level)
- Default marketplace sort: quality score (with promoted listings interleaved)
- Decay function: stale products lose ranking unless engagement maintained
- Cold start: new products get 7-day boost, then decay to earned score

## Acceptance Criteria
- [ ] Quality scores computed daily for all active products
- [ ] Seller health scores computed daily for all active shops
- [ ] Default marketplace sort uses quality score
- [ ] Promoted listings interleaved correctly with ranked results
- [ ] New products get initial visibility boost (7 days)
- [ ] Score decay penalizes stale, low-engagement products
- [ ] "Top Rated" badge on products scoring in top 10%
- [ ] "Fast Seller" badge on shops with < 2hr response time
- [ ] Gaming prevention: same product re-listed doesn't reset score
- [ ] Scores recalculated at off-peak hours (02:00 SAST)

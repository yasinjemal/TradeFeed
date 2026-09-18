# Buyer audit follow-up — 18 September 2026

Implementation follows the mobile buyer audit and the request to make the improvements directly. These are branch changes; production verification is still required after deployment. Existing unrelated work in the original checkout was left untouched.

## Ranked changes

1. **Separate enquiries from tracked orders and restore guest support.** Product and card WhatsApp links now say “Ask”, and product/tracking/help copy explains that direct enquiries do not create tracked orders. Cart checkout stores a 30-day HTTP-only checkout capability; support accepts that proof, an authenticated owner, or the existing matching phone. Buyers without proof have a visible contact fallback. Failed verification retains the entered message. Support controls wait for hydration before accepting input. Local browser coverage verifies rejection without proof and success with matching proof; it does not send a live order or WhatsApp message.
2. **Stop silently ordering an unspecified advertised size.** Listings advertising a size range with only the initial Default option cannot enter the cart through the product panel. Buyers see “Sizes unconfirmed” and “Ask about sizes”; seller readiness names the missing options. Real options supersede Default placeholders. Standard remains a legitimate option. Actual stock and sizes must be supplied by the seller.
3. **Make prices and filters agree.** Marketplace, shop cards and recommendations use effective retail prices and display “From” when options differ. The product panel calculates the same option prices before selection. Rand filter inputs convert to cents; sorting uses the accepted URL key. Category and location scope survive sorting and pagination. Promoted items no longer bypass explicit search, location, category, price or sort choices.
4. **State missing returns terms honestly.** Delivery and returns remain visible even when the seller has supplied no policy. The page explicitly asks buyers to confirm terms and costs before payment. This does not invent a refund promise or alter seller data.
5. **Remove incidental search matches when explicit matches exist.** All-word product-title matches take precedence over description-only candidates, including simple sneaker/sneakers normalization. Existing fuzzy search remains the fallback when no title match exists.
6. **Bring category products into the first mobile screen.** The category introduction sits below navigation, uses a compact heading and collapsed subcategories, and omits the featured-seller section. Browser coverage checks the first product begins above 600px at a 390×844 viewport. Blanket verified-seller claims were removed where the results include unverified sellers.
7. **Scope review empty states correctly.** A product without reviews says “No reviews for this product yet” and links to the shop review section instead of implying that the shop has no reviews.

## Validation

- Local isolated PostgreSQL quality database and seeded products with variable prices, placeholder sizes and incidental search keywords.
- Unit suite: 505 passed, one database-suite placeholder skipped; database integration suite separately passed all seven checks.
- Database checks cover duplicate checkout, stock reservation/expiry, overselling, tenant/payment boundaries, marketplace eligibility and review moderation.
- All 37 Chromium browser checks passed, covering the buyer paths above plus existing public/auth/seller routes.
- ESLint and the final production build (including TypeScript checks) passed.
- No production data was changed; no payment, live order or customer message was sent.

## Remaining verification / next pass

Deploy the branch, then revisit the affected live routes at 390px. Sellers still need to enter real size/colour stock and returns terms. Those facts cannot be inferred from titles or fabricated by a code fix.

Next pass: use an explicitly designated test shop and buyer to follow one cart checkout through seller acknowledgement, tracking, cancellation/return and support resolution. Validate notifications and signed-in buyer ownership against that controlled lifecycle. The local capability test does not prove external message delivery, production cookie behaviour or seller response time. Measure cart completion, successful order lookup, support verification failures and enquiry-to-order conversion after release; no conversion uplift is claimed from local tests.

# TradeFeed activation sprint — 16–23 September 2026

Prepared from read-only production data on 2026-09-16T15:40:48.416Z. No outreach has been sent. This is an operating queue, not evidence of seller consent or completed activation. Check the admin contact/opt-out record before outreach.

## This week’s target

Help these ten existing sellers publish three useful, in-stock listings; share their catalogue with existing customers; and confirm their first genuine non-owner buyer enquiry. Track enquiries and orders separately. Photos, prices, stock and fulfilment promises must come from the seller.

## Ten-seller work queue

Prioritises shops created in the last 30 days with unfinished catalogues; shops already listing come first. Sequence opt-outs are excluded. Quality count is a content check (image, positive minimum price, category, 40-character description), not stock verification.

| Shop | Joined | Active listings | Content-ready | Missing photos | Next action |
|---|---|---:|---:|---:|---|
| [Tekza](https://tradefeed.co.za/catalog/tekza) | 2026-09-16 | 1 | 1 | 0 | Complete price, stock, category and description for three listings |
| [PE TRUCK PARTS](https://tradefeed.co.za/catalog/pe-truck-parts) | 2026-09-16 | 2 | 2 | 0 | Complete price, stock, category and description for three listings |
| [Stella & Barbapapa Creations](https://tradefeed.co.za/catalog/stella-barbapapa-creations) | 2026-09-16 | 3 | 0 | 3 | Get real product photos and finish three listings |
| [Flash Pop-Up Sale](https://tradefeed.co.za/catalog/flash-pop-up-sale) | 2026-09-14 | 3 | 1 | 0 | Complete price, stock, category and description for three listings |
| [Kiki's Collective](https://tradefeed.co.za/catalog/kikis-collective) | 2026-09-10 | 4 | 0 | 3 | Get real product photos and finish three listings |
| [TecSociety Pty Ltd](https://tradefeed.co.za/catalog/tecsociety-pty-ltd) | 2026-09-08 | 1 | 1 | 0 | Complete price, stock, category and description for three listings |
| [Drxçh®️](https://tradefeed.co.za/catalog/drxh) | 2026-09-06 | 1 | 0 | 0 | Complete price, stock, category and description for three listings |
| [LaceUp by Karen](https://tradefeed.co.za/catalog/laceup-by-karen) | 2026-08-25 | 4 | 0 | 0 | Complete price, stock, category and description for three listings |
| [QueenB](https://tradefeed.co.za/catalog/queenb) | 2026-08-21 | 1 | 0 | 1 | Get real product photos and finish three listings |
| [Glam Braids SA](https://tradefeed.co.za/catalog/glam-braids-sa) | 2026-08-20 | 1 | 0 | 0 | Complete price, stock, category and description for three listings |

## Draft outreach

Hi [shop name], I’m checking in from TradeFeed. Would you like help finishing three product listings and sharing your catalogue with your existing WhatsApp customers? We can help with the listing setup using your product photos, prices and stock details. Reply here if you would like help.

After seller engagement: confirm collection/delivery terms, finish listings, ask the seller to use the dashboard Share catalog action, and follow up on any buyer enquiry. Do not send to opted-out contacts or automatically send a marketing campaign from this list.

## Daily owner checklist

- Days 1–2: publish the tested fixes; work through first five sellers; resolve photos and stock.
- Days 3–4: work through remaining five; confirm catalogue shares and identified buyer visits.
- Days 5–7: ask sellers which enquiries were real, record order outcomes, and identify the next bottleneck.
- Record per shop: contacted date, accepted help, three ready listings, catalogue shared, buyer enquiry date, seller confirmation, order outcome, next action. Leave missing outcomes unknown.

## Old pending orders to reconcile

Do not bulk mark these delivered or cancelled. Ask sellers for actual outcomes; paid state must follow payment evidence.

| Shop | Pending over 7 days |
|---|---:|
| smiley fashion shop | 12 |
| MEN'S CORNERS | 7 |
| Rutbrand | 4 |
| Omyfashions | 3 |
| Malashe Fashion store | 3 |
| Avatane | 1 |
| JONY HAFIZ | 1 |
| Thelma Forever Living products | 1 |
| queensfashion | 1 |

## Release impact and limits

The new discovery rules currently qualify 225 retail products, versus 254 displayed in the earlier marketplace audit. Listings remain in seller catalogues and editable dashboards; discovery eligibility returns when photos, positive pricing and available stock are supplied. Flagged products are excluded. Categories and descriptions are guided improvements rather than hard discovery gates.

Product-created milestones now record across the shared product-save path and catalogue import. No historical events are fabricated. The completion event still means the seller reached the onboarding celebration screen; the activation dashboard continues to derive product progress from durable product records.

The workspace already contained unrelated unfinished changes before this sprint. Release review must distinguish this sprint from existing WhatsApp, PayFast and media work. Production release and outreach are separate from local implementation.

## Validation

- Full unit suite: 496 passing tests. Database integration tests were not enabled against production.
- TypeScript: passed.
- ESLint on changed source and tests: passed.
- Production build: passed.
- Local production-build browser check: the previously incorrect Gift Box page now says Not yet verified and Ask about returns; payment is arranged with the seller; review wording no longer claims every review is verified.
- Not deployed; no seller outreach sent. No seller inventory or order status was changed in production.

# TradeFeed Tally Research Forms

**Status:** implementation blueprint
**Version:** `2026-07-27-v1`
**Scope:** exactly three direct-link Tally forms; no embedded forms, pixels, file uploads, or automatic spreadsheet integrations at launch

## Objective

These forms support TradeFeed's current activation path:

```text
seller signs up -> creates shop -> publishes first product -> shares catalogue
-> receives a buyer view or WhatsApp enquiry
```

They are deliberately narrower than a general survey programme:

| Form | Job | Primary audience | Accountable owner | Review cadence |
|---|---|---|---|---|
| 1. Seller interview / free shop setup request | Rescue a seller who has not reached activation and learn where setup breaks down | Prospective or newly signed-up sellers | Activation owner / founder | Every business day |
| 2. Import my WhatsApp catalogue | Assess and assist a seller who already has product information in WhatsApp | Sellers blocked by catalogue migration effort | Activation/import owner | Every business day |
| 3. Why did you stop using TradeFeed? | Learn why a seller paused before or after activation | Inactive or churned sellers | Product owner / founder | Weekly; daily when help is requested |

Use direct links before adding any TradeFeed embed. A direct link is easier to remove, version, and distribute selectively while the research loop is being proven.

## Launch gates

Do not collect live responses until all of the following are complete:

1. Create the Tally workspace with a TradeFeed-owned business account, not a personal account. Enable the strongest available sign-in protection and name a backup owner.
2. Record Tally as an operator/service provider in TradeFeed's vendor register. The business/privacy owner must review the applicable data-processing terms, subprocessors, hosting locations, deletion process, and safeguards for any processing outside South Africa.
3. Update `https://tradefeed.co.za/privacy` before launch if the privacy owner confirms that the current notice does not adequately disclose:
   - seller research and support-request data;
   - Tally as the form processor;
   - the purposes below;
   - the raw-response retention period; and
   - any cross-border processing.
4. Confirm that `privacy@tradefeed.co.za` is monitored for access, correction, objection, and deletion requests.
5. Give access only to the founder/product owner, the person handling activation, and support staff who need it. Review access quarterly.
6. Keep file upload, custom tracking pixels, advertising integrations, and automatic Google Sheets/Notion exports off for version 1.
7. Submit and then delete synthetic test responses before sharing any public link.

This blueprint supports POPIA-aligned data minimisation and transparency, but the responsible business/privacy owner still owns the final legal and vendor review.

## Common build standard

### Form presentation

- Brand name: `TradeFeed`
- Language for version 1: plain South African English
- Mobile-first: test at 360 px width and with the mobile keyboard open
- Progress bar: on
- Question numbering: off
- Estimated completion time: state it in the introduction
- One question per page where practical
- File uploads: off
- CAPTCHA or equivalent spam control: on, if available
- Custom analytics and advertising pixels: off
- Tally branding/custom domain: not a launch dependency
- Save-and-resume or respondent authentication: off unless the privacy owner separately approves it
- Do not collect respondent email automatically. Only show a contact field after the respondent explicitly asks for contact.
- Disable Tally's Respondent ID on all three forms. It creates a persistent
  cross-form identifier within a workspace and is not needed for this research.
  If that changes later, the privacy owner must approve and disclose it before
  it is enabled.

### Shared short privacy notice

Place this text immediately before the final acknowledgement on every form:

> TradeFeed will use this response only to provide the help you request, understand seller or buyer needs, and improve TradeFeed. Tally processes this form for TradeFeed. Do not enter passwords, one-time codes, bank or card details, customer personal information, or private WhatsApp messages. Providing feedback is voluntary. Read our [Privacy Policy](https://tradefeed.co.za/privacy). To request access, correction, objection, or deletion, email [privacy@tradefeed.co.za](mailto:privacy@tradefeed.co.za).

Use this required checkbox directly below it:

**Field ID:** `privacy_acknowledgement`

> I understand how TradeFeed will use this response and I want to submit it.

This is an acknowledgement of the disclosed processing. It is not marketing consent.

### Conditional contact permission

Where a respondent selects `Yes` to follow-up, show the contact method and only the matching contact field. Then require this checkbox:

**Field ID:** `contact_permission`

> Yes, TradeFeed may contact me about this response using the method I selected.

Do not use this permission for promotions, newsletters, unrelated research, or repeated sales messages. Do not contact respondents who selected `No`.

### Hidden attribution fields

Create the following hidden fields on all three forms:

| Hidden field | Allowed example values | Rule |
|---|---|---|
| `source` | `dashboard`, `lifecycle_email`, `whatsapp_support`, `support_page`, `founder_outreach`, `social`, `direct` | Broad origin only |
| `medium` | `in_app`, `email`, `whatsapp`, `web`, `social`, `qr`, `link` | Use lowercase slugs |
| `campaign` | `seller_activation_aug_2026`, `churn_followup_aug_2026` | Campaign slug, not a person's name |
| `content` | `empty_shop_card`, `day_3_nudge`, `contact_footer` | Placement or message variant |
| `entry_point` | `get_started`, `seller_dashboard`, `contact_page`, `direct_outreach` | Product entry point |
| `form_version` | `2026-07-27-v1` | Hard-code this value for these builds |
| `locale` | `en`, `af`, `zu`, `xh` | Omit if unknown; do not infer ethnicity |

Allowed URL example:

```text
?source=dashboard&medium=in_app&campaign=seller_activation_aug_2026&content=empty_shop_card&entry_point=seller_dashboard&form_version=2026-07-27-v1&locale=en
```

Never put a name, email address, phone number, Clerk/user ID, shop ID, shop slug, private dashboard URL, or other customer identifier into a form URL or hidden field. If account-specific help is needed, ask the respondent to enter their public catalogue URL inside the form.

### Controlled research tags

Apply these tags during the weekly review. Do not invent a new synonym when an existing value fits.

**Activation blocker**

```text
auth
shop_setup
first_product
import_effort
ai_listing_quality
unclear_next_step
catalogue_share
buyer_acquisition
whatsapp_order_fit
technical_reliability
pricing_value
trust_privacy
alternative_tool
business_paused
other
```

**Requested outcome**

```text
get_shop_live
publish_first_product
import_catalogue
improve_listing_quality
share_catalogue
reach_first_buyer
receive_structured_orders
understand_analytics
resolve_billing
resolve_account_issue
other
```

**Seller segment**

```text
fashion_clothing
footwear_sneakers
beauty_personal_care
food_grocery
home_lifestyle
electronics_accessories
services
other
unknown
```

**Severity**

```text
blocking
major_workaround
minor
idea
```

## Form 1: Seller interview / free shop setup request

### Build identity

- **Internal ID:** `seller_setup_help_v1`
- **Public title:** `Seller interview / free shop setup request`
- **Purpose:** move a seller to the next activation milestone and capture the exact setup obstacle in the seller's own words
- **Expected completion time:** 3 minutes
- **Primary distribution:** `/get-started`, empty-shop dashboard state, support conversations, and permission-based founder outreach

### Exact introduction

> Stuck before your shop is live? Tell us where you are and we will help you reach the next step: creating your shop, publishing your first product, and sharing your catalogue. This takes about 3 minutes. Setup help is free. We aim to reply within 24 hours on business days (Monday to Friday).

### Fields and logic

| Order | Field ID and type | Exact label / choices | Required | Conditional logic |
|---:|---|---|:---:|---|
| 1 | `current_stage` - single choice | **How far have you got?** Choices: `I have not signed up yet`; `I signed up but have not created a shop`; `My shop exists but has no products`; `I have products but have not shared my catalogue`; `I shared my catalogue but have not seen buyer interest`; `Something else` | Yes | If `Something else`, show `current_stage_other` |
| 2 | `current_stage_other` - short text | **Where are you currently stuck?** | Yes when shown | Show only for `Something else` |
| 3 | `business_name` - short text | **What name do customers know your business or shop by?** Helper: `Do not enter a company registration number.` | Yes | Always |
| 4 | `seller_segment` - single choice | **What do you mainly sell?** Choices: `Fashion or clothing`; `Footwear or sneakers`; `Beauty or personal care`; `Food or groceries`; `Home or lifestyle products`; `Electronics or accessories`; `Services`; `Something else` | Yes | If `Something else`, show `seller_segment_other` |
| 5 | `seller_segment_other` - short text | **What do you sell?** | Yes when shown | Show only for `Something else` |
| 6 | `province` - dropdown | **Which province is your business based in?** Choices: all nine South African provinces, plus `Outside South Africa` | Yes | Always |
| 7 | `city` - short text | **Which city or town?** Helper: `Business location only; a street address is not needed.` | No | Always |
| 8 | `help_needed` - multiple choice, max 3 | **What would you like help with? Choose up to three.** Choices: `Sign up or log in`; `Create or complete my shop`; `Add my first product`; `Use an AI listing from a photo`; `Import products I already have`; `Set up my WhatsApp number or order flow`; `Share my catalogue link`; `Get my first buyer visits or enquiries`; `Fix a technical problem`; `Something else` | Yes | Branches below |
| 9 | `import_source` - single choice | **Where are your product details now?** Choices: `WhatsApp Business catalogue`; `Spreadsheet or CSV`; `Facebook or Instagram`; `Photos on my phone`; `An existing website`; `Somewhere else` | Yes when shown | Show when `help_needed` contains `Import products I already have` |
| 10 | `product_count` - single choice | **Roughly how many products do you want to add?** Choices: `1-10`; `11-20`; `21-50`; `51-200`; `More than 200`; `Not sure` | No | Show with `import_source` |
| 11 | `technical_issue` - long text, 800 character limit | **What happened, and what were you trying to do?** Helper: `Do not paste passwords, one-time codes, payment details, customer details, or private messages.` | Yes when shown | Show when `help_needed` contains `Fix a technical problem` |
| 12 | `device_type` - single choice | **Which device were you using?** Choices: `Android phone`; `iPhone`; `Windows computer`; `Mac`; `Another device`; `Not sure` | Yes when shown | Show with `technical_issue` |
| 13 | `blocker_detail` - long text, 600 character limit | **What is the one thing stopping you right now?** | Yes | Always |
| 14 | `public_shop_url` - URL | **Your public TradeFeed catalogue link, if you have one** Helper: `Use the public shop link only, never a private dashboard link.` | No | Show unless `current_stage` is `I have not signed up yet` |
| 15 | `preferred_contact` - single choice | **How should we reply?** Choices: `WhatsApp`; `Email` | Yes | Controls fields 16-17 |
| 16 | `contact_whatsapp` - phone | **WhatsApp number** Helper: `Include the country code, for example +27 83 503 4502.` | Yes when shown | Show only for `WhatsApp` |
| 17 | `contact_email` - email | **Email address** | Yes when shown | Show only for `Email` |
| 18 | `best_contact_time` - single choice | **When is usually best to contact you?** Choices: `Weekday morning`; `Weekday afternoon`; `Weekday evening`; `Any business hour` | No | Always |
| 19 | `contact_permission` - checkbox | Use the shared conditional contact-permission wording | Yes | Always; the service cannot be delivered without a reply channel |
| 20 | `research_call_permission` - checkbox | **Optional:** `TradeFeed may also invite me once to a 20-minute seller research call about this setup experience.` | No | Always |
| 21 | `privacy_acknowledgement` - checkbox | Show the shared privacy notice and acknowledgement | Yes | Always |

### Ending

**Title:** `Thanks - your setup request is in.`

**Body:**

> We aim to reply within 24 hours on business days using the method you selected. We will never ask for your password, one-time code, bank details, or card details. For urgent account or billing help, email [support@tradefeed.co.za](mailto:support@tradefeed.co.za).

**Buttons:**

- `Return to TradeFeed` -> `https://tradefeed.co.za`
- `Open the Help Centre` -> `https://tradefeed.co.za/contact`

### Ownership and routing

- Activation owner checks the queue once each business day before 10:00 SAST.
- Tag every useful response with one `activation_blocker`, one `requested_outcome`, one `seller_segment`, the reported `current_stage`, and the hidden attribution fields.
- A `technical_issue`, billing concern, account access concern, or explicit privacy concern is copied into the appropriate support/privacy workflow with only the information needed to resolve it.
- The activation owner acknowledges the request within one business day. Do not promise that setup itself will be completed in that period.
- Contact only through the selected method. `research_call_permission` is separate and does not expand the setup-contact permission.

## Form 2: Import my WhatsApp catalogue

### Build identity

- **Internal ID:** `whatsapp_catalogue_import_v1`
- **Public title:** `Import my WhatsApp catalogue`
- **Purpose:** assess a seller's existing product information and choose the safest practical route to a live TradeFeed catalogue
- **Expected completion time:** 3-4 minutes
- **Primary distribution:** onboarding help, seller dashboard, support conversations, and permission-based founder outreach to sellers with an existing WhatsApp catalogue

### Exact introduction

> Already have products in WhatsApp? Tell us how your catalogue is organised and we will assess the safest practical way to get those products into TradeFeed. This takes about 3 minutes. It is a request for help, not an automatic import or a guarantee that every format can be imported. Do not upload or send a WhatsApp chat backup, customer contacts, private conversations, passwords, one-time codes, or payment details.

### Fields and logic

| Order | Field ID and type | Exact label / choices | Required | Conditional logic |
|---:|---|---|:---:|---|
| 1 | `shop_stage` - single choice | **Do you already have a TradeFeed shop?** Choices: `Yes - it is live`; `Yes - but setup is not finished`; `No`; `Not sure` | Yes | `Yes` choices show field 2 |
| 2 | `public_shop_url` - URL | **Your public TradeFeed catalogue link** Helper: `Use the public shop link only, never a private dashboard link.` | No | Show for either `Yes` choice |
| 3 | `business_name` - short text | **What name do customers know your business or shop by?** Helper: `Do not enter a company registration number.` | Yes | Always |
| 4 | `seller_segment` - single choice | **What do you mainly sell?** Use the shared seller-segment choices | Yes | If `Something else`, show `seller_segment_other` |
| 5 | `seller_segment_other` - short text | **What do you sell?** | Yes when shown | Show only for `Something else` |
| 6 | `catalogue_location` - single choice | **Where is your product information now?** Choices: `A WhatsApp Business catalogue`; `Product photos and prices in WhatsApp chats`; `Product photos on my phone`; `A PDF or price list shared through WhatsApp`; `A spreadsheet or document shared through WhatsApp`; `More than one of these`; `Not sure` | Yes | Controls readiness branches |
| 7 | `catalogue_size` - single choice | **Roughly how many products do you want to move?** Choices: `1-10`; `11-20`; `21-50`; `51-200`; `More than 200`; `Not sure` | Yes | Always |
| 8 | `information_available` - multiple choice | **What information do you already have for most products?** Choices: `Product names`; `Prices`; `Descriptions`; `Product photos`; `Stock or availability`; `Sizes, colours, or other variants`; `Product codes or SKUs`; `None of these is consistent` | Yes | Always |
| 9 | `variant_complexity` - single choice | **Do products have choices such as size or colour?** Choices: `No`; `Yes - usually one choice`; `Yes - several combinations`; `Not sure` | Yes | Always |
| 10 | `catalogue_access` - single choice | **Who controls the WhatsApp catalogue or product files?** Choices: `I do`; `Someone on my team does`; `A former staff member or agency does`; `I am not sure` | Yes | If not `I do`, show field 11 |
| 11 | `access_detail` - long text, 500 characters | **What would be needed to get access to the product information?** Helper: `Do not enter another person's phone number or private account details.` | Yes when shown | Show unless `catalogue_access=I do` |
| 12 | `import_outcome` - single choice | **What kind of help would suit you best?** Choices: `Show me how to import it myself`; `Help me prepare a spreadsheet or CSV`; `Help me reuse my product photos and details`; `Assess whether TradeFeed can assist with the import`; `I am not sure` | Yes | Always |
| 13 | `import_blocker` - long text, 600 characters | **What is the hardest part about moving your catalogue?** | Yes | Always |
| 14 | `source_rights_confirmation` - checkbox | **I confirm that I own, or have permission to use, the product information and images I want to move.** | Yes | Always |
| 15 | `customer_data_confirmation` - checkbox | **I understand that TradeFeed needs product information only. I will not send customer contacts, private chats, chat backups, passwords, one-time codes, or payment details.** | Yes | Always |
| 16 | `urgency` - single choice | **When would you like to start?** Choices: `As soon as possible`; `Within a week`; `Within a month`; `I am only exploring` | No | Always |
| 17 | `preferred_contact` - single choice | **How should we reply?** Choices: `WhatsApp`; `Email` | Yes | Controls fields 18-19 |
| 18 | `contact_whatsapp` - phone | **WhatsApp number** Helper: `Include the country code, for example +27 83 503 4502.` | Yes when shown | Show only for `WhatsApp` |
| 19 | `contact_email` - email | **Email address** | Yes when shown | Show only for `Email` |
| 20 | `contact_permission` - checkbox | Use the shared conditional contact-permission wording | Yes | Always; a reply is required to assess the import |
| 21 | `research_call_permission` - checkbox | **Optional:** `TradeFeed may also invite me once to a 20-minute seller interview about catalogue importing.` | No | Always |
| 22 | `privacy_acknowledgement` - checkbox | Show the shared privacy notice and acknowledgement | Yes | Always |

### Import-specific safety rules

- Keep file upload disabled. This form collects an assessment, not catalogue data.
- Never request a full WhatsApp export, chat backup, contact list, private chat screenshot, or device backup.
- Do not promise a one-click import. The available route depends on what product data the seller controls and the import methods TradeFeed supports at the time of review.
- If a later support step requires a CSV or product images, provide a fresh, approved transfer instruction and restate what must be removed. Do not ask the seller to email a chat archive.
- Stop the request and route it to the privacy owner if the seller supplies customer information, private conversations, or credentials despite the warning.
- Do not import images or descriptions unless the seller confirms ownership or permission.

### Ending

**Title:** `Thanks - your catalogue import request is in.`

**Body:**

> We will review how your product information is organised and aim to reply within 24 hours on business days. Please do not send a WhatsApp chat backup, customer contacts, private conversations, passwords, one-time codes, bank details, or card details. We will explain the next safe step after the assessment.

**Buttons:**

- `Return to TradeFeed` -> `https://tradefeed.co.za`
- `Open the Help Centre` -> `https://tradefeed.co.za/contact`

### Ownership and routing

- The activation/import owner checks the queue once each business day before 10:00 SAST.
- Tag each response with `catalogue_location`, `catalogue_size`, `seller_segment`, `shop_stage`, `import_outcome`, and attribution.
- Add one internal readiness tag:
  - `structured_whatsapp_catalogue`
  - `photo_or_chat_mixed`
  - `document_or_spreadsheet`
  - `access_blocked`
  - `unknown`
- `More than 200`, `access_blocked`, or several variant combinations requires a manual scope check before any commitment.
- A technical account problem routes to support. A rights, customer-data, or privacy concern routes to `privacy@tradefeed.co.za`.
- Acknowledge the request within one business day, but do not quote a completion date until the data source and supported path have been assessed.
- Contact only through the selected method. The optional seller-interview permission is separate from the import follow-up.

## Form 3: Why did you stop using TradeFeed?

### Build identity

- **Internal ID:** `stopped_using_research_v1`
- **Public title:** `What stopped you from using TradeFeed?`
- **Purpose:** identify the real abandonment point and the outcome that could justify a return
- **Expected completion time:** 3 minutes
- **Primary distribution:** permission-compliant one-to-one follow-up to inactive sellers; never a scraped or unsolicited bulk list

### Exact introduction

> If TradeFeed was not useful enough to keep using, tell us plainly. This takes about 3 minutes, there is no sales pitch, and your answer will not affect your account. You may answer without giving contact details. If you want a reply or help, choose that near the end.

### Fields and logic

| Order | Field ID and type | Exact label / choices | Required | Conditional logic |
|---:|---|---|:---:|---|
| 1 | `last_stage` - single choice | **How far did you get?** Choices: `I did not finish signing up`; `I signed up but did not create a shop`; `I created a shop but added no products`; `I added products but did not share my catalogue`; `I shared my catalogue but got no useful buyer interest`; `I used TradeFeed for a while and then paused`; `I cannot remember` | Yes | Always |
| 2 | `primary_stop_reason` - single choice | **What was the main reason you stopped?** Choices: `Sign-up or login was too difficult`; `Shop setup took too long or was confusing`; `Adding or importing products was too much work`; `The AI listing result was not useful`; `I did not know what to do next`; `I could not get buyers or enquiries`; `The WhatsApp order flow did not fit my business`; `A feature I needed was missing`; `Something did not work`; `The price or value did not work for me`; `I had a trust or privacy concern`; `I use another tool or method`; `My business changed or paused`; `Another reason` | Yes | Controls fields 3-12 |
| 3 | `unclear_step_detail` - long text, 600 characters | **Which step was hardest or unclear?** | Yes when shown | Show for sign-up, setup, or unclear-next-step reasons |
| 4 | `listing_effort_detail` - long text, 600 characters | **What would have made adding your products easier?** | Yes when shown | Show for adding/importing or AI-listing reasons |
| 5 | `buyer_actions` - multiple choice | **What did you try after your catalogue was live?** Choices: `Shared it on WhatsApp Status`; `Sent it directly to customers`; `Shared it in a WhatsApp group with permission`; `Shared it on social media`; `Did not share it`; `Tried something else` | Yes when shown | Show for no-buyer reason |
| 6 | `buyer_detail` - long text, 500 characters | **What result were you hoping for?** | No | Show with `buyer_actions` |
| 7 | `whatsapp_fit_detail` - long text, 600 characters | **What did you need the WhatsApp order flow to do differently?** | Yes when shown | Show for WhatsApp-fit reason |
| 8 | `missing_outcome` - long text, 600 characters | **What outcome did you need that TradeFeed could not give you?** | Yes when shown | Show for missing-feature reason |
| 9 | `technical_detail` - long text, 800 characters | **What happened, and what were you trying to do?** Helper: use the same sensitive-data warning as Form 1 | Yes when shown | Show for technical reason |
| 10 | `pricing_detail` - single choice plus optional comment | **What did not feel worth the cost?** Choices: `The free-plan limit`; `The Pro plan price`; `A payment or transaction fee`; `The difference between plans was unclear`; `Something else` | Yes when shown | Show for price/value reason; show `pricing_comment` for `Something else` |
| 11 | `trust_detail` - long text, 600 characters | **What made you feel uncertain or unsafe?** Helper: `Do not include private account, payment, or customer information.` | Yes when shown | Show for trust/privacy reason |
| 12 | `alternative_detail` - long text, 600 characters | **What do you use instead, and what does it do better for you?** | Yes when shown | Show for another-tool reason |
| 13 | `other_stop_detail` - long text, 600 characters | **Tell us the main reason in your own words.** | Yes when shown | Show for business-paused or another-reason choices |
| 14 | `return_trigger` - long text, 500 character limit | **What one change or result would make TradeFeed worth trying again?** | Yes | Always |
| 15 | `seller_segment` - single choice | **What did you mainly sell?** Use the shared seller-segment choices plus `Prefer not to say` | No | Always |
| 16 | `help_now` - single choice | **Would help from TradeFeed be useful now?** Choices: `No thanks`; `Yes - help me set up my shop`; `Yes - help me add or import products`; `Yes - help me reach my first buyers`; `Yes - help me fix a problem` | Yes | If any `Yes`, preselect but do not force `follow_up=yes` |
| 17 | `follow_up` - single choice | **May TradeFeed contact you about this response?** Choices: `Yes`; `No` | Yes | `Yes` shows fields 18-21 |
| 18 | `preferred_contact` - single choice | **How should we contact you?** Choices: `WhatsApp`; `Email` | Yes when shown | Show for `follow_up=Yes` |
| 19 | `contact_whatsapp` - phone | **WhatsApp number** with the shared format helper | Yes when shown | Show only for `WhatsApp` |
| 20 | `contact_email` - email | **Email address** | Yes when shown | Show only for `Email` |
| 21 | `public_shop_url` - URL | **Your public TradeFeed catalogue link, if account-specific help would be useful** | No | Show for `follow_up=Yes` |
| 22 | `contact_permission` - checkbox | Use the shared conditional contact-permission wording | Yes when shown | Show for `follow_up=Yes` |
| 23 | `privacy_acknowledgement` - checkbox | Show the shared privacy notice and acknowledgement | Yes | Always |

### Endings

Use conditional logic to send respondents to one of two endings.

**No-contact ending title:** `Thanks for being direct.`

> We review response patterns every week. You selected no contact, so TradeFeed will not follow up about this response. If you later want help, visit [tradefeed.co.za/contact](https://tradefeed.co.za/contact). This form does not delete your account; account or data-deletion requests must go to [support@tradefeed.co.za](mailto:support@tradefeed.co.za) or [privacy@tradefeed.co.za](mailto:privacy@tradefeed.co.za).

**Contact ending title:** `Thanks - we will follow up.`

> We will use only the contact method you selected and aim to reply within 24 hours on business days. We will not add you to marketing messages because you submitted this form.

### Ownership and routing

- Product owner reviews all responses at the same time each week and records the leading stage, blocker, requested outcome, segment, and source.
- Any respondent who asks for help enters the activation/support queue that business day. The submitted form is not itself a support SLA.
- Send technical blocking issues to support with severity `blocking`.
- Send privacy concerns and rights requests to `privacy@tradefeed.co.za`; do not leave them only as research tags.
- A respondent who selected `No` to follow-up remains uncontacted even if their criticism would be useful to discuss.
- Treat multiple submissions from one distribution campaign as a signal to investigate, not proof that a feature should be built.

## Data ownership, retention, and deletion

### Ownership

- TradeFeed is the responsible party for the response data.
- The TradeFeed business workspace is the source of truth for raw Tally submissions.
- The accountable owners named above own response handling; the privacy owner owns rights requests and the retention check.
- Do not make a personal spreadsheet or download responses to an unmanaged device.
- Do not copy phone numbers, email addresses, shop links, or unredacted free text into product-roadmap documents.

### Version 1 retention schedule

Adopt and publish this schedule only after the business/privacy owner approves it:

| Data | Retention |
|---|---|
| Raw Tally response | Permanently delete within 90 days of submission |
| Contact details in the research response | Delete when follow-up is complete or at 90 days, whichever comes first |
| Information copied to a support case | Follow the approved support-record retention schedule; copy only what is necessary |
| De-identified blocker/outcome tags and aggregate counts | May be retained for product planning |
| De-identified quotes | May be retained only after names, contact details, shop links, customer details, and unique identifiers are removed |
| Synthetic QA submissions | Delete immediately after launch QA |

During the fixed weekly review, delete submissions that are 75 days old or
older and then permanently remove those entries from Tally Trash. Tally's
automatic retention control is a Business-plan feature, and both automatic
and manual deletion first move submissions to Trash for up to another 90
days. Moving an entry to Trash alone therefore does not satisfy TradeFeed's
90-day promise. Keep these forms in a dedicated TradeFeed workspace so the
operator can verify the exact expired/test items before emptying Trash.

A valid deletion request is handled across Tally, controlled exports, and any
linked support record within the period stated in TradeFeed's Privacy Policy.

### Exports and integrations

- No automatic Google Sheets, Notion, Slack, or CRM integration for version 1.
- If a CSV is required for a weekly review, download it to approved encrypted business storage, record the export date/owner, remove direct identifiers before analysis, and delete the raw export after the review.
- Email notifications should contain the minimum useful information. If Tally cannot limit notification contents, use a restricted business inbox and do not forward full responses.

## Distribution rules

| Form | Good placements | Do not do |
|---|---|---|
| Seller setup help | Empty-shop dashboard state, `/get-started` help link, support reply, consented founder outreach | Do not post it as a promise of unlimited done-for-you setup |
| WhatsApp catalogue import | Seller dashboard, onboarding help, support reply, and permission-based outreach to sellers who already have product data | Do not request chat exports, customer contacts, credentials, or files through the form |
| Stopped-using research | Targeted service follow-up where TradeFeed has a lawful contact basis; direct link after a seller says they stopped | Do not bulk-message scraped numbers or imply the seller must respond to keep the account |

Use a clean direct URL plus non-PII attribution parameters. Never prefill a respondent's private details into the link.

## Weekly operating loop

1. Activation owner checks help and blocking queues each business day.
2. Product owner reviews research responses at one fixed weekly time.
3. Remove spam, internal tests, and exact duplicates.
4. Apply one primary blocker, one requested outcome, one segment, one severity, and source attribution.
5. Count independent sellers/buyers, not submissions or checkbox votes.
6. Contact only respondents with explicit contact permission, through the selected channel.
7. Record a de-identified weekly summary:

```text
Week ending:
Submissions by form:
Useful responses by form:
Consented follow-ups:
Follow-ups acknowledged within one business day:
Top activation stage:
Top activation blocker:
Top requested outcome:
Independent respondents describing that outcome:
Top seller segment:
Source/entry point producing the most useful responses:
One de-identified verbatim insight:
Decision: follow up / test copy or process / investigate defect / no action yet
Retention or privacy exceptions:
```

A **useful response** identifies a specific stage, blocker, or desired outcome clearly enough to support a follow-up question or a product/process decision. Contact details alone do not make a response useful.

Promote an outcome into product discovery only after multiple independent respondents describe the same underlying problem. A defect that blocks shop operation can be prioritised immediately on severity and evidence; it does not need a popularity threshold.

## Launch QA checklist

### Governance and access

- [ ] TradeFeed business account owns the workspace.
- [ ] Backup owner and minimum necessary collaborators are documented.
- [ ] Strong sign-in protection is enabled where available.
- [ ] Vendor/data-processing, subprocessor, hosting, deletion, and cross-border review is recorded.
- [ ] Privacy notice is updated or the privacy owner has documented why no update is required.
- [ ] `privacy@tradefeed.co.za` and `support@tradefeed.co.za` are monitored.
- [ ] The permanent-deletion owner and weekly 75-day review reminder exist.

### Build correctness

- [ ] There are exactly three live forms with the titles and version IDs in this document.
- [ ] Every field uses the specified stable field ID.
- [ ] Required fields cannot be bypassed.
- [ ] Every conditional branch was tested once with synthetic data.
- [ ] Only the selected contact field appears.
- [ ] Contact permission is required only when contact is requested.
- [ ] Selecting no contact never exposes or requires a contact field.
- [ ] Every form contains the exact short privacy notice and required acknowledgement.
- [ ] No form accepts file uploads.
- [ ] No custom analytics, advertising pixel, or automatic third-party data export is enabled.
- [ ] Free-text fields have the stated limits and sensitive-data warnings.
- [ ] The public catalogue URL helper says not to use a dashboard URL.
- [ ] Endings match the selected branch and contain working TradeFeed links.

### Attribution and privacy

- [ ] Direct links work with no query string.
- [ ] Each allowed hidden field is captured from a test link.
- [ ] Unknown hidden-field values do not break submission.
- [ ] No distributed URL contains a name, phone, email, user ID, shop ID/slug, or signed token.
- [ ] Page source, confirmation text, email notifications, and exports expose no hidden test secrets.
- [ ] A synthetic access/deletion request can be located and removed from Tally and any test export.
- [ ] The synthetic deletion test is also removed from Tally Trash.
- [ ] Custom tracking and marketing cookies are not added to the forms.
- [ ] Tally Respondent ID is disabled on all three forms.

### Mobile, accessibility, and operations

- [ ] Complete each form on Android-size and iPhone-size viewports.
- [ ] Complete each form using only a keyboard.
- [ ] Labels remain visible when validation errors appear.
- [ ] Phone and email validation accept realistic South African details.
- [ ] All nine province choices and `Outside South Africa` are present.
- [ ] Long choice labels wrap without hiding radio buttons or checkboxes.
- [ ] Spam protection does not prevent a normal mobile submission.
- [ ] Queue owners receive or can see the synthetic submissions.
- [ ] Blocking, support, activation, and privacy routes reach the correct owner.
- [ ] All synthetic submissions and raw QA exports are deleted.

## Two-week launch checkpoint

After 14 days, report:

- useful responses and completed follow-ups by form;
- response-to-conversation conversion;
- the leading activation blocker and stage;
- repeated desired outcomes from independent respondents;
- median business-hours response time for setup requests;
- distribution source producing useful responses; and
- any privacy, spam, or routing failure.

The initial success test is at least 10 useful seller conversations or a clear finding that distribution, rather than form design, is the bottleneck. Do not add more forms until this checkpoint is reviewed.

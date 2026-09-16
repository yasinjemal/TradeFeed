# Seller support assistant

The admin operations page now opens with the existing seller assistance engine: actionable suggestions, exact email previews, individual approvals, cancellation, and recent delivery/progress history. Manual shop follow-up, old-order reconciliation and measurement details are collapsed.

Approvals from either admin page invalidate both pages. The same reviewed fingerprint, opt-in version, suppression checks, seven-day frequency limit, duplicate prevention and daily delivery job remain in use. The assistant does not enable sending flags or opt sellers in. Delivery setup blockers are explained in plain language.

The daily job is scheduled at 08:00 UTC (10:00 SAST). Approval queues an email; it does not send immediately. Provider acceptance and confirmed delivery are distinct. Progress is re-evaluated on page load/refresh, not continuously polled. Only three existing assistance situations are supported; arbitrary manual notes are not sent as emails.

Validation: 501 unit tests passed, including acceptance-versus-delivery history coverage. Type checking and lint passed. No customer email was sent and no production consent or delivery settings were changed. Authenticated admin approval was not manually exercised in a browser.

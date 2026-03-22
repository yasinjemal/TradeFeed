/**
 * Delivery Estimate — shown on product page
 * Gives SA buyers confidence about shipping timeframes.
 */
export function DeliveryEstimate() {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery</p>
      <div className="flex items-start gap-2.5 text-sm text-slate-700">
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M3.75 10.5V6.375a1.125 1.125 0 011.125-1.125h4.5V10.5m-6.375 0h6.375m0 0h6v-3.75m-6 3.75v-3.75m6 3.75h2.625M12 10.5V5.25h8.25a1.125 1.125 0 011.125 1.125v4.125" />
        </svg>
        <div>
          <p className="font-medium">Nationwide delivery — 2 to 5 business days</p>
          <p className="text-xs text-slate-500 mt-0.5">Gauteng & major metros: 1–3 days</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 text-sm text-slate-700">
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <div>
          <p className="font-medium">Collection available</p>
          <p className="text-xs text-slate-500 mt-0.5">Contact seller for pickup details</p>
        </div>
      </div>
    </div>
  );
}

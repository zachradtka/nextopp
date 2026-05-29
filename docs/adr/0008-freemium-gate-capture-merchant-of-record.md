# Freemium pricing: gate Capture, never cap data; sell via a Merchant of Record

Going public needs a revenue model that covers cost without bankrupting the operator. NextOpp's only material variable cost is **Capture** ([CONTEXT.md](../../CONTEXT.md)) — LLM tokens through the Vercel AI Gateway plus Firecrawl scrapes; storage, rows, and page views are effectively free. We decided on a freemium model with a flat-rate **Pro** **Plan** that gates **Capture alone**: every **Plan**, including Free, keeps unlimited **Opportunities**, **Import**, search, and tracking. The **Capture allowance** decrements only on a *successful* **Capture attempt**; a separate **Capture rate limit** caps attempts (success or failure) to protect spend on failures and abuse. Payments run through a Merchant of Record (Polar / Lemon Squeezy / Paddle), not Stripe-direct.

## Considered options

- **Cap Opportunities on the Free Plan (classic SaaS row limit).** Rejected: rows are nearly free to store, and capping the core tracking function makes the Free tier feel broken — which kills the word-of-mouth a genuinely useful free tier buys, for no real cost saving. We cap the expensive thing (Capture), not the cheap thing (rows).
- **Capture as a Pro-only feature, no free taste.** Rejected: Free users would never feel the "magic" that converts them; a small free allowance *is* the demo.
- **Usage credits / pay-as-you-go.** Rejected for v1: revenue would track cost almost exactly, but credit-balance UX adds friction at the precise magic moment, and a flat price is easier for a job-seeker audience to reason about. Revisit if a handful of power users distort unit economics.
- **Meter every attempt against the allowance.** Rejected: failed scrapes are common on bot-blocked job boards, so charging allowance for them is punitive and generates "it didn't work but cost me a Capture" support. Successes meter the *user*; the separate **Capture rate limit** protects the *operator*.
- **Stripe-direct (+ Stripe Tax).** Rejected: Stripe Tax *calculates* tax but does not register or remit it; a solo operator selling worldwide would owe filings across many jurisdictions. A Merchant of Record is legally the seller and handles global VAT/sales-tax, invoicing, and chargebacks — worth the higher take rate to make worldwide selling legal on day one. Revisit only if margins demand it at scale.

## Consequences

- Free-tier cost is bounded by (Free **Capture allowance** × active free Accounts) and the **Capture rate limit**, with the global AI-spend circuit breaker as the catastrophic backstop. Setting the Free allowance and the Pro price is a separate calibration against the *measured* per-Capture cost (LLM + Firecrawl) — not fixed by this ADR.
- The MoR is the source of truth for **Plan**; the app mirrors Plan state into the DB via the MoR's webhook (idempotent, signature-verified). Because data is never capped, a Pro→Free transition (cancellation, failed payment, refund) simply re-gates **Capture** at the next cycle — no data migration, nothing held hostage.
- Allowance and rate-limit counters live in Postgres (durable, auditable, transactional with Plan changes and the webhook), not in Redis.
- The Vercel AI Gateway can bill against the operator's own provider keys (BYOK); these economics assume gateway-billed usage. If unit cost ever dominates, BYOK or a cheaper model on the Free Plan are available levers without changing the pricing shape.

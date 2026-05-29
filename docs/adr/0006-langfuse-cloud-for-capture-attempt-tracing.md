# Langfuse Cloud for Capture attempt tracing

We instrument every **Capture attempt** ([CONTEXT.md](../../CONTEXT.md)) with OpenTelemetry spans and ship them to Langfuse Cloud for tracing and failure investigation. The Vercel AI Gateway stays in place as the model router — Langfuse layers on top via `@langfuse/otel`'s `LangfuseSpanProcessor`, registered in `instrumentation.ts`. The AI SDK auto-emits a child `ai.generateObject` span when `experimental_telemetry.isEnabled` is set; the Firecrawl `fetch` is wrapped in a manual `firecrawl.scrape` span. Both sit under a root `capture-attempt` span carrying app-level metadata (`userId`, `sourceType`, `model`, `promptVersion`, `errorCode`, `durationMs`). One trace per Capture attempt.

The goal is twofold: (1) inspect any given Capture attempt end-to-end after the fact, including the prompt, the raw response, and which prompt version was running; (2) get told when Capture starts failing in a way we can fix. Today, the only failure signal is a single `console.error` in [parse-job-posting.ts](../../src/lib/actions/parse-job-posting.ts) that disappears into Vercel runtime logs with no app context.

## Considered options

- **Vercel AI Gateway dashboard alone.** The Gateway already provides per-call latency and token usage for the text path. Rejected because it sees neither the URL/Firecrawl path nor any app-side context (which user, which prompt version, which error code) — exactly the joins needed to investigate a failed Capture.
- **Helicone (proxy mode).** Drop-in replacement for the Vercel AI Gateway via `@helicone/ai-sdk-provider`. Rejected because it would replace, not layer on, the existing Gateway — losing BYOK routing and the dashboard already in use — and would still not help with the Firecrawl path.
- **Helicone (manual logger).** Layer-on equivalent to Langfuse via `HeliconeManualLogger` + `after()`. Rejected on ergonomics: Langfuse's OTel integration is native to the AI SDK (auto spans + `experimental_telemetry`), so the text-path instrumentation reduces to "turn on a flag" rather than "wrap every call." The Firecrawl path uses the same OTel span primitive, giving one mental model for both.
- **Postgres table + admin route.** Considered for self-hoster friendliness. Rejected for now because we'd be reinventing trace UI; revisit if Langfuse Cloud's free tier (50k events/mo) becomes a constraint.

## Consequences

- New dependency on Langfuse Cloud for the AI-enabled flows. When `AI_GATEWAY_API_KEY` or `FIRECRAWL_API_KEY` are not set, Capture is already disabled — Langfuse instrumentation is gated the same way and adds no runtime cost in the non-AI configuration.
- `parseJobPosting` ends every invocation with `after(() => langfuseSpanProcessor.forceFlush())`. Without this, traces are lost when the Vercel function freezes. This is a hard requirement, not an optimisation.
- Failure classification is partitioned, not flat. `couldnt_extract`, `ai_provider_error`, and `timeout` are tagged as error spans and feed Langfuse threshold alerts (configured in the Langfuse UI, not in code). `url_blocked` and `url_unreachable` are tagged with their code but not marked as span errors — they're mostly external and would otherwise drown the alert signal. `invalid_input` and `not_configured` are user/operator errors and excluded from "failure" entirely. Re-classifying later is cheap (a string mapping in [parse-job-posting.ts](../../src/lib/actions/parse-job-posting.ts)); the current split reflects what's actionable today.
- Prompts stay in source. Each prompt has a sibling `CAPTURE_PROMPT_VERSION` constant; on every meaningful prompt change we bump the version and pass it as Langfuse metadata. We deliberately do not use Langfuse Prompt Management — keeping prompts in PRs preserves reviewability and atomicity with code changes, at the cost of needing a redeploy to change a prompt.
- The `userId` sent to Langfuse is the opaque Account id (Auth.js `users.id`), never the **Primary email**. Same identifier used everywhere else for cross-system correlation.

## Privacy boundary (resolved for public launch)

Traces originally captured the full pasted text and the full extracted JSON — appropriate only while the single user *is* the trace owner. Pasted job descriptions carry personal notes (referrals, salary expectations, reasons for leaving), so shipping them to a third-party SaaS is a personal-data disclosure that cannot stand once strangers sign up.

Resolved before opening sign-ups: traces default to **metadata only** — `userId`, source type, model, prompt version, error code, `durationMs` — and never include pasted text or extracted JSON. A per-**Account** opt-in toggle ("help improve Capture", default off) is the *only* path by which full content is retained, and only for Accounts that explicitly enable it. Metadata alone still drives the failure-rate alerting this ADR exists for; full-content replay becomes a consented extra rather than the default. Account deletion must purge any opted-in content held in Langfuse (see the data-lifecycle work).

Rejected at decision time: truncation + hashing for non-opted users (a truncated job description is still partial personal data and muddies the consent story), and self-hosting Langfuse (real ops burden for a solo operator, and it still leaves the disclosure and deletion duties intact).

## Out of scope

- Linking a Capture attempt trace to the **Opportunity** it produced. Today, `parseJobPosting` returns parsed data and `createOpportunity` is a separate server action. Threading the trace id through the form to attach it on Opportunity create is a small follow-up, deferred until the basic instrumentation is in use.
- Sampling. At single-user volume, every Capture attempt is traced. Free tier (50k events/mo) is not a constraint until public launch; revisit then.
- Tracing non-Capture LLM flows. No other LLM calls exist today. Future LLM features adopt the same `capture-attempt`-shaped pattern under a different root span name.

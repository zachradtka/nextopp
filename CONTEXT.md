# NextOpp

A job-opportunity tracker. The domain models a single user's progression of job applications from "I might apply" through "offer accepted" (or "rejected" / "withdrawn"), with the ability to hide stale entries without deleting them.

## Language

**Opportunity**:
A single job posting the user is tracking — company + role + a few attributes. The central entity; every other concept hangs off it.
_Avoid_: Application, lead, job (ambiguous), posting

**Capture**:
Creating a single **Opportunity** from a pasted job URL or job-description text via an LLM, instead of manual field entry.
_Avoid_: Import (reserved for the CSV path), parse, scrape, AI add

**Capture attempt**:
One user-initiated **Capture**, from form submission through the parse-and-return server action. The unit of observability — every Capture attempt produces exactly one Langfuse trace, tagged with `userId`, source type (`url` or `text`), model, prompt version, duration, and (on failure) the `ParseJobPostingErrorCode`. The Opportunity that ultimately gets created (or not) is a separate downstream action; a Capture attempt's success means "the parse returned usable structured data," not "an Opportunity exists."
_Avoid_: Parse call, LLM call (Capture attempts span both the LLM-direct text path and the LLM-inside-Firecrawl URL path; calling them "LLM calls" hides the URL path)

**Import**:
Bulk creation of many **Opportunities** from a CSV file — an administrative operation, not part of the in-app flow.
_Avoid_: Capture, upload, sync

**Status**:
Where the **Opportunity** sits in the application pipeline. One of a fixed set of seven values: `saved`, `applied`, `interviewing`, `offered`, `rejected`, `withdrawn`, `accepted`. Lives as a text column, not a separate table.
_Avoid_: State, stage, phase

**Archive** (verb) / **Archived** (state):
To hide an **Opportunity** from the default list without deleting it. Stored as an independent boolean column — orthogonal to **Status**. An **Opportunity** with any **Status** can be archived; archiving does not change **Status**.
_Avoid_: Hide, close (close has GH-issues connotations of state, which is what **Status** is for)

**Active list**:
The default `/opportunities` view, showing **Opportunities** that are not archived.
_Avoid_: Open, current, inbox

**Archive list**:
The `/opportunities?archived=true` view, showing only archived **Opportunities**.
_Avoid_: Closed, history, trash

**Status History**:
The append-only log of **Status** transitions for an **Opportunity**. A new entry is written only when **Status** actually changes — no-op transitions do not produce entries.
_Avoid_: Audit log, timeline (the UI uses "timeline" for the combined history + comments view, but **Status History** specifically means the status-transition log)

**Global search**:
The search input in the top bar. Always present. Queries across all lists at once — today, the **Active list** and **Archive list** together. A hit from the **Archive list** is displayed with an "archived" indicator so it's not confused with an active **Opportunity**.
_Avoid_: scope, scoped (overloaded — see Flagged ambiguities), command bar (suggests Cmd-K navigation, which this is not)

**Page search**:
A search input embedded in a single list page. Queries only that page's **Opportunities** — **Page search** on the **Active list** never reaches the **Archive list**, and vice versa. Independent from **Global search**: each maintains its own query state.
_Avoid_: scope, scoped, list search, filter bar (the **Status** filter pills are the "filter bar")

**Qualifier**:
A `field:value` token inside a search query that restricts which field(s) the search term matches. Examples: `company:micro`, `status:applied`. Works identically inside **Global search** and **Page search**. A bare term (no qualifier) matches across all qualifier-addressable fields — the default behavior.
_Avoid_: scope marker, field operator, facet (faceted-browse UIs are a different pattern with checkbox sidebars)

**Account**:
A NextOpp identity — what a person signs in to and which owns their **Opportunities**. One Account per real person. An Account has one **Primary email** and zero or more **Linked accounts**. Mapped to the `users` table in the Auth.js schema (the naming inversion is intentional — see Flagged ambiguities).
_Avoid_: user (the word still appears in code via Auth.js's `users` table, but in user-facing copy and design conversation prefer **Account**), profile

**Linked account**:
A sign-in provider attached to an **Account**. An Account may have multiple Linked accounts — for example GitHub plus Google plus LinkedIn — and signing in via any of them lands the person in the same Account. Each Linked account stores the provider name and the provider's account id; the **Primary email** is independent of which Linked account was used to sign in. Mapped to the `accounts` table in the Auth.js schema.
_Avoid_: connection, identity (overloaded — see Flagged ambiguities), social account (only some Linked accounts are "social")

**Primary email**:
The **Account**'s anchor email. Set at signup from whichever provider was used first, and locked thereafter (changing it is a deferred feature). Used as the magic-link delivery target, as the address checked against `ALLOWED_USERS`, and as the user-visible "main" email in the UI. Other **Linked accounts** may claim different emails — those are stored on the **Linked account** row but never surface as the Account's primary identifier.
_Avoid_: account email, main email

**Plan**:
The subscription tier an **Account** is on — `Free` or `Pro`. A **Plan** governs exactly one thing: the **Account**'s **Capture allowance**. Every **Plan**, including Free, has unlimited **Opportunities**, **Import**, search, and tracking — only **Capture** is gated by **Plan**.
_Avoid_: tier (acceptable in code, but **Plan** in copy), subscription, level

**Capture allowance**:
The number of successful **Captures** an **Account** may make per month, set by its **Plan**. Only a successful **Capture attempt** (one that returns usable data) decrements the allowance; a failed attempt does not, because the user received nothing. Distinct from the **Capture rate limit**.
_Avoid_: quota, credits (we are not usage-credit priced), limit

**Capture rate limit**:
A ceiling on **Capture attempts** — successful or failed — over a short window, applied per **Account** to cap operator cost (every attempt incurs LLM and/or Firecrawl spend regardless of outcome). Orthogonal to the **Capture allowance**: the allowance is a fairness budget for the user, the rate limit is a safety budget for the operator.
_Avoid_: throttle, quota

## Relationships

- An **Opportunity** enters the system one of three ways: manual field entry, **Capture**, or **Import**.
- A **Capture attempt** produces zero or one parsed result. On success, the user may create, edit, or discard the resulting **Opportunity** in a separate downstream action — the **Capture attempt** itself ends when the parse server action returns.
- An **Opportunity** has exactly one current **Status** and one **Archived** state.
- An **Opportunity** has zero or more **Status History** entries, one per real **Status** transition.
- **Status** and **Archived** are independent: any combination is valid.
- The **Active list** and **Archive list** partition all **Opportunities** by **Archived**; every **Opportunity** appears in exactly one.
- **Global search** spans both the **Active list** and the **Archive list**. **Page search** stays within a single list.
- A **Qualifier** composes inside either a **Global search** or **Page search**: typing `company:micro` works the same way in both.
- An **Account** owns its **Opportunities** outright; ownership never crosses Accounts (no shared, no transferred).
- An **Account** has exactly one **Primary email** and zero or more **Linked accounts**; signing in via any **Linked account** lands the person in the same **Account**.
- An **Account** is on exactly one **Plan** at a time; the **Plan** sets its **Capture allowance**.
- A successful **Capture attempt** decrements the **Account**'s **Capture allowance**; a failed **Capture attempt** does not. Both successful and failed attempts count toward the **Capture rate limit**.

## Example dialogue

> **Dev:** "If I bulk-archive five **Opportunities**, do their **Statuses** change?"
> **Domain expert:** "No. Archiving is orthogonal to **Status**. A rejected opportunity stays 'rejected' after archiving; a 'saved' one stays 'saved'. The **Status History** isn't touched either."
>
> **Dev:** "What if I bulk-set status to 'interviewing' on five **Opportunities**, but two are already 'interviewing'?"
> **Domain expert:** "Those two are no-ops. No DB write, no **Status History** entry, no `updatedAt` bump. The other three change normally — including writing **Status History** entries."

## Flagged ambiguities

- **"Status" vs "Archived"** are sometimes spoken about as if interchangeable ("change its status to archived"), but in the schema they are independent columns. **Archived** is not a **Status** value. When a user says "mark as archived," they mean toggling the boolean, not changing the seven-value **Status** enum.
- **"Timeline"** is used by the UI to mean the combined view of **Status History** + comments on an **Opportunity** detail page. When referring strictly to status transitions, use **Status History**.
- **"Import"** was used informally for both the CSV bulk path and the AI single-opportunity feature — resolved: **Import** is CSV-only; the AI feature is **Capture**.
- **"Scoped" / "scope"** was used to mean both "limited to a particular page" (per-list search) and "limited to a particular field" (`company:micro` syntax) — two independent ideas. Resolved: the per-list concept is **Page search**, the per-field concept is a **Qualifier**. "Scope" / "scoped" should not appear in either sense in code or copy.
- **"Account" vs the Auth.js `accounts` table**: the Auth.js library names its two auth tables `users` (one row per identity) and `accounts` (one row per sign-in provider). Our domain inverts the labels: an **Account** is what we call the identity (Auth.js's `users` row), and a **Linked account** is what we call a sign-in provider (Auth.js's `accounts` row). The table names cannot change — they're dictated by `@auth/drizzle-adapter`. In code we use the library names; in user-facing copy, design conversation, and CONTEXT we use **Account** and **Linked account**. Don't let the table names drive vocabulary.

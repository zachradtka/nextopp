# Auto-link sign-in providers on verified email match

We enable Auth.js's `allowDangerousEmailAccountLinking: true` flag for every currently-enabled provider — GitHub, Google, LinkedIn, and Resend magic-link. When a user signs in via a new provider whose email matches an existing **Account**, the system silently links the new provider to that Account. A toast notification confirms the link; the Account's Settings page lists all linked providers and supports unlinking. This realises the user goal of "logins on any of the login types are linked" without manual steps.

The Auth.js flag is named "dangerous" because in general, allowing email-based linking lets an attacker create a third-party account with a victim's email and silently take over the victim's app Account. That threat requires the third-party provider to either skip email verification or be compromised. For our specific provider set, that doesn't apply: GitHub, Google, and LinkedIn all verify primary emails, and the Resend magic-link flow proves email control by definition. The "dangerous" label is correct as a library-wide default; it is the wrong default *for this app's specific provider set*.

We chose this over two alternatives. Re-confirmation via email at link time would force the user to click a "confirm linking" link mid-sign-in, roughly doubling the friction of every second-provider login — the marginal security gain is not justified for our verified-email provider set. Blocking sign-in and requiring explicit linking from Settings is today's behaviour, which produced the request to fix this — the user has to remember which provider they originally signed up with, sign in with it, navigate to Settings, then link the second provider, three extra steps for a flow that should be invisible.

The decision is hard to reverse: auto-linked Accounts cannot be cleanly split apart without breaking ownership of Opportunities and their child records (Status History, comments). A future change of policy would have to either grandfather existing links (inconsistent state) or leave all current links auto-linked while new links require manual action (also inconsistent). So the trust criterion needs to be right now, not later.

## Per-provider opt-in

The trust criterion is **"the provider proves email ownership at sign-in time."** Each provider added to the auth config must explicitly opt into auto-linking. Today's four providers all opt in. If a future provider is added that doesn't verify emails (a custom OAuth provider where the user could lie about their email; Twitter, which is historically weak here; etc.), it must NOT opt in — for that provider, linking is only available from inside Settings while authenticated, and the OAuth callback will fall through to the existing `OAuthAccountNotLinked` error on sign-in collision.

## Background

This decision sits inside a broader Linked account architecture from the same design session:

- **Account** vs **Linked account** vs **Provider** are pinned in [CONTEXT.md](../../CONTEXT.md), including the flagged ambiguity that the Auth.js `accounts` table actually stores Linked accounts (not user-facing Accounts).
- Settings → Linked accounts shows each provider with Connect / Unlink, plus the currently-linked status. This is the v1 of meaningful content on the Settings page (which is currently a flagged-off stub).
- **Primary email** is locked at signup. Changing it is deferred to a future feature with its own verification flow.
- Magic-link sign-in is implicit on the **Primary email** — there is no separate "link magic-link" action because the Resend provider has no third-party `providerAccountId` to store.
- Unlinking is allowed without re-auth and does NOT invalidate active sessions. The confirm dialog notes the magic-link fallback when unlinking the last OAuth provider.
- **Account merging** (the case where two pre-existing Accounts each have Opportunities and need combining) is deferred to a tracking issue — it's a one-shot per user, expensive to build, and the manual workaround (delete the unwanted Account, re-link providers) suffices for now.

## Consequences

- Auth config sets `allowDangerousEmailAccountLinking: true` on GitHub, Google, LinkedIn, and Resend. The naming is documented as misleading-for-our-case in a comment that points at this ADR.
- The `signIn` callback distinguishes "sign-in with auto-link" from "linking event triggered from an authenticated Settings session." In the latter case, the `ALLOWED_USERS` check is skipped because the existing Account is the trust anchor, not the new provider's email. (Without this, a user whose Primary email is on the allow list but who tries to link a provider with a different email would be rejected — confusing and wrong.)
- A toast surface is added at sign-in to make the auto-link action visible; the user can immediately undo from Settings if it was unexpected.
- The `accounts` table's existing `PRIMARY KEY (provider, providerAccountId)` constraint naturally prevents one provider record from being linked to multiple Accounts. The friendly error UX for that collision case (`"This Google account is already linked to a different NextOpp account…"`) is part of the implementation, not the schema.
- Adding any future provider is a code-level decision: verify-email opt-in or link-only-from-Settings. There is no third option.

## Out of scope (covered elsewhere)

- The Settings UI shape, the unlink confirm-dialog copy, and the toast wording — issue
- Display name / avatar identity defaults and editability — issue
- Account merging — deferred tracking issue
- Secondary verified emails, change Primary email, custom avatar upload — deferred tracking issues
- Opening NextOpp to the public (removing `ALLOWED_USERS` entirely) — its own grilling session, separate from this feature

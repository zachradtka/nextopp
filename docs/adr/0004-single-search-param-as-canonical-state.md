# All search state lives in a single `?search=` URL param

Search query state — bare terms, **Qualifiers** (`company:micro`, `status:applied`), and what the **StatusFilter** pills are currently set to — is encoded entirely in one `?search=` URL parameter, both for **Global search** and **Page search**. The pills are reflective UI: they parse `?search=` to know which to highlight, and pill clicks rewrite `?search=` in place. There is no separate `?status=` param.

This **breaks backward compatibility** with the previous URL shape (`?status=applied&search=acme`). Bookmarks and external links using the old form will no longer round-trip correctly. For a single-user app where we know the bookmark surface, that cost is accepted.

We picked this over the alternative — keeping `?status=` separate and only encoding *other* qualifiers inline in `?search=` — because the asymmetry compounds. Every future qualifier we promote to its own UI affordance (a `location:` dropdown, a salary range slider) would force the same decision again: does it get its own URL param? Does it get pills? You end up with a mix where some qualifiers are structured params and others live inline, and the rendering logic for the search bar has to merge both sources on every render. Choosing symmetry now — *every* qualifier lives in `?search=` identically; *any* UI affordance is a reactive view on top — pays its complexity cost once (a small lex/rewrite helper for pill clicks) and never again.

## Background

This sits inside a larger search redesign:

- **Global search** lives in the top bar and queries across both the **Active list** and **Archive list**, with results shown on a new `/search?q=...` route as a flat list with archive badges.
- **Page search** lives on each list page and stays within that list.
- **Qualifiers** are `field:value` tokens (`company:micro`, `status:applied`). v1 ships five: `company`, `role`, `jobId`, `location`, `status`. Bare terms match across the four text fields (no `status`).
- Grammar: AND default, quoted phrases, `-` for negation, repeat-or-comma for OR within a qualifier, no boolean `OR`/parentheses (deferred indefinitely — that direction leads to building half of Lucene).
- The pg_trgm index work in [ADR-0003](./0003-postgres-on-neon-for-full-text-search.md) is the runtime backing for all of this.

## Consequences

- The `StatusFilter` component becomes a *reactive view* on `?search=`. On render it parses the string for `status:` tokens to know which pills to highlight. On pill click it lex/rewrites the string, removing or inserting `status:` tokens, and pushes the new URL.
- A small lexer/serializer module (probably `src/lib/search/query.ts`) becomes the single source of truth for parsing `?search=` strings into structured queries and vice versa. Used by the input, by the pills, and by the server-side query builder.
- The server reads exactly one input — `?search=` — and produces a SQL query from it. No more reading multiple params and ANDing them.
- Existing URLs using `?status=...` will no longer apply a status filter after this lands. We accept this and do not implement a redirect grace period.
- Adding any future qualifier is a code-level addition (extend the lexer, add a UI affordance if desired, add the SQL mapping) with **no URL schema decision** required. This is the structural win the ADR is paying for.

## Out of scope for this ADR (covered elsewhere)

- The grammar specifics (`-`, quotes, AND default, etc.) — captured in the search-bars issues
- The `/search` route and its layout — issue
- Discoverability surfaces (placeholder text, `?` cheat-sheet popover, inline errors, empty states) — issue
- Autocomplete, recent / saved searches, additional Tier-3 qualifiers — deferred to future issues

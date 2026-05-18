# NextOpp

A job-opportunity tracker. The domain models a single user's progression of job applications from "I might apply" through "offer accepted" (or "rejected" / "withdrawn"), with the ability to hide stale entries without deleting them.

## Language

**Opportunity**:
A single job posting the user is tracking — company + role + a few attributes. The central entity; every other concept hangs off it.
_Avoid_: Application, lead, job (ambiguous), posting

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

## Relationships

- An **Opportunity** has exactly one current **Status** and one **Archived** state.
- An **Opportunity** has zero or more **Status History** entries, one per real **Status** transition.
- **Status** and **Archived** are independent: any combination is valid.
- The **Active list** and **Archive list** partition all **Opportunities** by **Archived**; every **Opportunity** appears in exactly one.

## Example dialogue

> **Dev:** "If I bulk-archive five **Opportunities**, do their **Statuses** change?"
> **Domain expert:** "No. Archiving is orthogonal to **Status**. A rejected opportunity stays 'rejected' after archiving; a 'saved' one stays 'saved'. The **Status History** isn't touched either."
>
> **Dev:** "What if I bulk-set status to 'interviewing' on five **Opportunities**, but two are already 'interviewing'?"
> **Domain expert:** "Those two are no-ops. No DB write, no **Status History** entry, no `updatedAt` bump. The other three change normally — including writing **Status History** entries."

## Flagged ambiguities

- **"Status" vs "Archived"** are sometimes spoken about as if interchangeable ("change its status to archived"), but in the schema they are independent columns. **Archived** is not a **Status** value. When a user says "mark as archived," they mean toggling the boolean, not changing the seven-value **Status** enum.
- **"Timeline"** is used by the UI to mean the combined view of **Status History** + comments on an **Opportunity** detail page. When referring strictly to status transitions, use **Status History**.

# Collection Lifecycle

How a collection record moves from scheduled to resolved, what is automated, and
where the gaps are. Verified against the codebase and production data on
**28 July 2026**.

---

## States

A `reru_collections` row is always one of three states:

| State | Meaning | Written by |
|---|---|---|
| `scheduled` | Created, not yet resolved | `POST /api/admin/collections` (single date) or `/bulk-schedule` (4-week rota) |
| `completed` | Crew collected; `bags_collected`, `completed_at`, `recorded_by` are set | `PATCH /api/admin/collections/:id` |
| `missed` | Crew did not collect | `PATCH /api/admin/collections/:id` |

## The happy path

1. Staff generate the rota with **Bulk schedule (4 weeks)**, or add specific
   clients for a date with **Schedule collection**. Rows are created as
   `scheduled`.
2. On collection day, staff open **Today** (`/dashboard/admin/schedule`) or
   **Collections** (`/dashboard/admin/collections`).
3. Each row has ✓ and ✗. ✓ opens a bag-count stepper and marks the row
   `completed`, recording the count in the same request. ✗ marks it `missed`.
4. Both write an `audit_logs` entry naming the admin who made the change.

The admin dashboard is responsive and has a mobile nav, so the crew can resolve
rows from a phone browser at the gate. **The Android app has no admin surface** —
it is a household client only — so field updates go through mobile web.

---

## Gap: nothing resolves a collection except a human

**There is no automatic state transition.** There are no cron jobs (`vercel.json`
declares only `{"framework":"nextjs"}`, and no cron route exists), and no
scheduled-job logic anywhere in the codebase. `missed` is written exclusively by
the manual `PATCH`.

A collection whose date has passed with nobody pressing ✓ or ✗ stays `scheduled`
indefinitely.

This is already happening in production:

```
2026-04-30  scheduled  89 days past its date
2026-05-27  scheduled  62 days past its date
2026-06-03  scheduled  55 days past its date
```

### Why it compounds

**The stale rows are effectively invisible.** Both admin views filter on a single
exact date — `.eq('scheduled_date', selectedDate)` — and "Today" shows only
today. No view anywhere lists past-dated unresolved collections. Finding the
30 April row requires guessing that date and navigating to it.

**They quietly distort the statistics.** Completion rate is
`completed / scheduled_total`, so every unresolved row sits in the denominator
and never the numerator. The reported rate understates real performance by an
amount nobody can see.

**A resolved status cannot be corrected.** `updateCollectionSchema` accepts only
`completed` or `missed` — never back to `scheduled` — and the row hides both
buttons once resolved (`admin-collection-row.tsx`, `isDone`). A mis-tap is
permanent through the UI and needs a database edit to undo. The crew taps these
on a phone at a gate, so mis-taps are a question of when, not whether.

---

## Open decisions

These need an operator's call, not a developer's:

1. **Should stale rows auto-resolve?** A nightly job could flip past-dated
   `scheduled` rows to `missed`. But that asserts a collection did not happen
   when the truth is that nobody recorded it. A distinct fourth state
   (`unrecorded`) would be more honest than either, at the cost of schema and UI
   changes. Auto-missing also marks a household's service record and could feed
   into a billing dispute.

2. **Should a resolved status be reversible?** Allowing `completed` ↔ `missed`,
   or a revert to `scheduled`, would fix mis-taps. `audit_logs` already records
   who changed what, so the trail survives the edit.

## Recommended next step

Independent of both decisions: **surface the backlog.** A view listing
past-dated `scheduled` collections would fix the invisibility and let the
existing three be cleared in one pass. It asserts nothing about what happened,
so it does not pre-empt decision 1.

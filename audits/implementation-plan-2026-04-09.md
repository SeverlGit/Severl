# Severl — Implementation Plan
**Generated:** 2026-04-09  
**Based on:** CEO Business Model Review (2026-04-09)  
**Author:** Claude Code (read-only analysis → plan)

---

## Overview

Three phases in priority order, based on impact vs. effort. Each phase is independently shippable.

| Phase | Feature | Effort | Impact | Prerequisite |
|-------|---------|--------|--------|--------------|
| 1 | Free tier adjustment (2 → 5 clients) | 30 min | High (top-of-funnel) | None |
| 2 | Shareable brand guide | 1–2 days | Medium (retention + awareness) | None |
| 3 | Client content approval workflow | 1–2 weeks | Very high (churn reduction + viral loop) | Phase 2 optional |

---

## Phase 1: Free Tier Adjustment

**Why:** The 2-client cap hits before users experience the value of the product. Most SMM freelancers start with 3–5 clients. Bumping to 5 improves conversion from free → paid by giving users enough runway to build a habit.

**Effort:** ~30 minutes. Two files, no migrations.

### Changes

**1. `lib/billing/tier-definitions.ts`**

```diff
- essential: { clients: 2,  deliverables: 15, storageBytes: 500 * 1024 ** 2 },
+ essential: { clients: 5,  deliverables: 25, storageBytes: 500 * 1024 ** 2 },
```

Also bump deliverables from 15 → 25 (5 clients × 5 deliverables/month feels right; 15 across 5 clients is too tight and will create confusion).

**2. `app/(dashboard)/billing/BillingClient.tsx`** — update the `plans` array copy:

```diff
- features: ['2 clients', '15 deliverables / month', '500 MB storage', 'Community support'],
+ features: ['5 clients', '25 deliverables / month', '500 MB storage', 'Community support'],
```

**3. `lib/auth/tier-limits.test.ts`** — update test expectations that assert the essential tier limits (grep for `clients: 2` or `deliverables: 15`).

### No DB migration needed.
The `plan_tier` column on orgs is unchanged. Existing essential users automatically get the higher limit at next request.

---

## Phase 2: Shareable Brand Guide

**Why:** The brand guide is currently an internal-only tab. Making it shareable turns it into a client-facing deliverable: the SMM sends a link, the client bookmarks it. This creates organic Severl awareness and makes the brand guide sticky — clients expect to receive it.

**Effort:** ~1–2 days. One DB migration, one server action, one public route, one UI button.

---

### 2A. DB Migration

Add a unique token column to `clients`. Token is `NULL` until first share — generated lazily.

```sql
-- Run in Supabase SQL editor or add to a migration file
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS brand_guide_token TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_brand_guide_token
  ON clients (brand_guide_token)
  WHERE brand_guide_token IS NOT NULL;
```

Update `db/schema.sql` to document this column alongside the existing `clients` table DDL.

---

### 2B. Update `lib/database.types.ts`

Add `brand_guide_token: string | null` to the `clients` Row type (or regenerate from Supabase if using the CLI).

---

### 2C. Server Action — `lib/clients/actions.ts`

Add `generateBrandGuideToken(clientId: string, orgId: string)`:

```ts
export async function generateBrandGuideToken(clientId: string, orgId: string) {
  const userId = await requireOrgAccess(orgId);
  const supabase = getSupabaseAdminClient();

  // Generate a URL-safe random token
  const token = crypto.randomUUID().replace(/-/g, '');

  const { error } = await supabase
    .from('clients')
    .update({ brand_guide_token: token })
    .eq('id', clientId)
    .eq('org_id', orgId);

  if (error) return { error: error.message };
  return { data: token };
}
```

---

### 2D. Public Route — `app/brand/[token]/page.tsx`

No auth required. Uses admin client to look up by token. Returns 404 if token is invalid.

```
app/
  brand/
    [token]/
      page.tsx   ← server component, public
```

Data fetch pattern:
```ts
// app/brand/[token]/page.tsx
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function BrandGuidePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, brand_name, vertical_data, vertical, platforms')
    .eq('brand_guide_token', token)
    .maybeSingle();

  if (!client) notFound();
  // Render brand guide fields read-only
  // Use the same VerticalConfig to resolve intakeFields for display
}
```

This route must be added to `middleware.ts` as a public route:
```ts
createRouteMatcher([
  // ...existing public routes...
  '/brand/(.*)',
])
```

---

### 2E. UI — Share Button in `BrandGuideTab.tsx`

Add a "Share with client" button in the top-right of the brand guide tab header. On click:
1. Call `generateBrandGuideToken` (or use existing token if already set)
2. Copy `${NEXT_PUBLIC_APP_URL}/brand/${token}` to clipboard
3. Toast: "Link copied — share with your client"

The button should show "Regenerate link" if a token already exists (with a confirmation warning: "This will invalidate the previous link").

---

### 2F. Add to public route matcher in `middleware.ts`

```diff
  createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/onboarding(.*)',
    '/api/cron(.*)',
    '/api/webhooks/stripe(.*)',
+   '/brand/(.*)',
  ])
```

---

## Phase 3: Client Content Approval Workflow

**Why:** This is the highest-leverage feature in the product. Every SMM sends content to clients for approval weekly. Right now that happens over email or WhatsApp — outside Severl. Capturing that loop makes Severl non-optional in the workflow, reduces churn dramatically, and creates a viral loop (clients see the Severl approval page and ask what tool it is).

**The schema is already prepared:** `pending_approval` and `approved` are existing values in the `deliverable_status` enum. The kanban board already renders both columns (`STATUS_KEYS` in `StatusBoard.tsx` line 26–33). This is mostly additive work, not a redesign.

**Effort:** ~1–2 weeks. DB migration + 2 server actions + 1 email template + 1 public route + UI button on DeliverableCard.

---

### 3A. DB Migration

Add approval tracking columns to `deliverables`:

```sql
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS approval_token      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS approval_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_notes      TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliverables_approval_token
  ON deliverables (approval_token)
  WHERE approval_token IS NOT NULL;
```

Update `db/schema.sql` and `lib/database.types.ts` accordingly.

---

### 3B. Server Action — `sendForApproval`

Lives in `lib/deliverables/actions.ts`:

```ts
export async function sendForApproval(deliverableId: string, orgId: string) {
  const userId = await requireOrgAccess(orgId);
  const supabase = getSupabaseAdminClient();

  // Fetch deliverable + client email
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, title, type, client_id, clients(brand_name, contact_email, contact_name)')
    .eq('id', deliverableId)
    .eq('org_id', orgId)
    .single();

  if (!deliverable) return { error: 'Deliverable not found' };

  const token = crypto.randomUUID().replace(/-/g, '');
  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`;

  const { error } = await supabase
    .from('deliverables')
    .update({
      status: 'pending_approval',
      approval_token: token,
      approval_sent_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)
    .eq('org_id', orgId);

  if (error) return { error: error.message };

  // Send email via Resend if contact_email exists
  const client = deliverable.clients as any;
  if (client?.contact_email) {
    await sendApprovalEmail({
      to: client.contact_email,
      contactName: client.contact_name ?? client.brand_name,
      brandName: client.brand_name,
      deliverableTitle: deliverable.title,
      deliverableType: deliverable.type,
      approvalUrl,
    });
  }

  revalidateTag(`dashboard-${orgId}`);
  return { data: approvalUrl };
}
```

---

### 3C. Public Action — `recordApproval`

This action is called from the public approval page (no auth). Validates token existence, does not require Clerk session.

```ts
// lib/deliverables/approval-actions.ts  (separate file — no requireOrgAccess)
export async function recordApproval(
  token: string,
  decision: 'approved' | 'revision_requested',
  notes?: string,
) {
  const supabase = getSupabaseAdminClient();

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, org_id, status')
    .eq('approval_token', token)
    .maybeSingle();

  if (!deliverable) return { error: 'Invalid approval link' };
  if (deliverable.status !== 'pending_approval') {
    return { error: 'This item has already been reviewed' };
  }

  const newStatus = decision === 'approved' ? 'approved' : 'in_progress';
  const { error } = await supabase
    .from('deliverables')
    .update({
      status: newStatus,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
      approval_notes: notes ?? null,
      // Clear token on approval so the link becomes single-use
      approval_token: decision === 'approved' ? null : deliverable.id,
    })
    .eq('id', deliverable.id);

  if (error) return { error: error.message };

  // Notify the SMM via email that client responded (optional — use Resend)
  return { data: decision };
}
```

**Note on token invalidation:** Clear the token on `approved` so the link can't be used twice. On `revision_requested`, keep the token so the SMM can see the notes (or regenerate on re-send).

---

### 3D. Email Template — `lib/email/approval.ts`

Mirrors the pattern of `lib/email/verification.ts`. Uses Resend.

```ts
// lib/email/approval.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail({
  to, contactName, brandName, deliverableTitle, deliverableType, approvalUrl,
}: {
  to: string; contactName: string; brandName: string;
  deliverableTitle: string; deliverableType: string; approvalUrl: string;
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@severl.app',
    to,
    subject: `Content ready for your review — ${brandName}`,
    html: approvalEmailHtml({ contactName, brandName, deliverableTitle, deliverableType, approvalUrl }),
  });
}
```

Email should:
- Have a clean, minimal design matching the Severl brand (warm cream bg, dusty rose CTA button)
- Show: deliverable title + type, "Your social media manager has submitted content for your review"
- Single CTA: "Review & Approve" → `approvalUrl`
- Footer: "Sent via Severl"

---

### 3E. Public Route — `app/approve/[token]/page.tsx`

```
app/
  approve/
    [token]/
      page.tsx        ← server component: loads deliverable by token, shows approval UI
      ApproveClient.tsx  ← "use client": approve / request revision buttons + notes textarea
```

**Server component** (`page.tsx`): fetches deliverable by `approval_token` using admin client. Shows 404 if not found. Shows "Already reviewed" if status is not `pending_approval`.

**Client component** (`ApproveClient.tsx`): 
- Shows deliverable title, type, which brand it's for
- "Approve" button (green/success) — calls `recordApproval(token, 'approved')`
- "Request Revisions" button (outline) — opens a textarea for notes, then calls `recordApproval(token, 'revision_requested', notes)`
- Both show confirmation state after submission: "Approved!" or "Revision notes sent"
- No Severl navigation chrome — clean, client-facing page (just the Severl logo + content)

Add to public routes in `middleware.ts`:
```diff
+   '/approve/(.*)',
```

---

### 3F. UI — "Send for Approval" button in `DeliverableCard.tsx`

Add a small action to `DeliverableCard` (and `DeliverableRow` for the list view):

- Show "Send for Approval" when `status === 'in_progress'`
- Show "Resend" when `status === 'pending_approval'` and `approval_sent_at` is set
- Show nothing (or a ✓ badge) when `status === 'approved'`
- On click: call `sendForApproval`, toast "Approval request sent to {contact_email}" (or "Link copied — no email on file" if no contact_email)

The button should be subtle — a small icon or secondary action, not a primary CTA. The primary CTA remains the status dropdown.

---

### 3G. Kanban Column Labels (cosmetic)

The `StatusBoard.tsx` already renders `pending_approval` and `approved` columns. Check the label map in that file and ensure:
- `pending_approval` → "With Client" (more intuitive than "Pending Approval")  
- `approved` → "Approved"

---

## Phased Rollout Order

```
Week 1:  Phase 1 (free tier) — ship immediately, no risk
Week 1:  Phase 2A-2C (brand guide token + server action) — DB migration + backend
Week 2:  Phase 2D-2F (brand guide public route + UI button) — ship Phase 2
Week 3:  Phase 3A-3C (approval DB + server actions + email) — backend first
Week 4:  Phase 3D-3G (public approval page + DeliverableCard UI) — ship Phase 3
```

---

## Files Touched Summary

### Phase 1 (free tier)
- `lib/billing/tier-definitions.ts` — bump essential limits
- `app/(dashboard)/billing/BillingClient.tsx` — update copy
- `lib/auth/tier-limits.test.ts` — update test expectations

### Phase 2 (shareable brand guide)
- `db/schema.sql` — add `brand_guide_token` to clients DDL
- `lib/database.types.ts` — add field to Row type
- `lib/clients/actions.ts` — add `generateBrandGuideToken`
- `app/brand/[token]/page.tsx` — new public route (create)
- `components/clients/BrandGuideTab.tsx` — add share button
- `middleware.ts` — add `/brand/(.*)` to public routes

### Phase 3 (approval workflow)
- `db/schema.sql` — add approval columns to deliverables DDL
- `lib/database.types.ts` — add fields to Row type
- `lib/deliverables/actions.ts` — add `sendForApproval`
- `lib/deliverables/approval-actions.ts` — new file: `recordApproval` (public, no auth)
- `lib/email/approval.ts` — new file: `sendApprovalEmail`
- `app/approve/[token]/page.tsx` — new public route (create)
- `app/approve/[token]/ApproveClient.tsx` — new client component (create)
- `components/deliverables/DeliverableCard.tsx` — add "Send for Approval" button
- `components/deliverables/DeliverableRow.tsx` — same
- `components/deliverables/StatusBoard.tsx` — update column label for `pending_approval`
- `middleware.ts` — add `/approve/(.*)` to public routes

---

## Known Gaps / Risks

| Gap | Risk | Mitigation |
|-----|------|------------|
| `recordApproval` has no rate limiting | Malicious actor could spam the token endpoint | Add simple token-expiry (7 days) checked in `recordApproval` |
| Approval email deliverability | Not yet verified in prod (same caveat as invoice emails) | Test Resend domain verification in staging first |
| `syncStripeTeamSeat` unverified | Agency billing may break on seat change | Verify before agency-tier marketing push |
| No approval_token expiry in schema | Links don't expire | Add `approval_expires_at timestamptz` column, check in `recordApproval` |

---

## What This Doesn't Cover (Deliberate Deferrals)

- **Content calendar** — Medium effort, high value, but doesn't block Phase 3. Build after approval workflow is live and you have feedback on how clients interact with the approval page.
- **Platform API integrations** (Instagram/TikTok) — Large effort, API rate limits, OAuth complexity. Do this after you have 50+ paying users who explicitly ask for it.
- **White-labeling** — Agency tier feature, defer until agency tier is validated.
- **Referral/affiliate program** — Wiring needed, but do this after the product loop (approval workflow) is in place so referrals don't churn.

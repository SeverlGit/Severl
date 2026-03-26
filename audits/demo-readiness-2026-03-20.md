# Demo-Readiness Audit
**Date:** 2026-03-20
**Verdict at a glance:** ⚠️ **CONDITIONAL GO** — 2 deploy blockers must be fixed, 5 should-fix items are high-visibility demo risks.

---

## Build & Type Safety

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ Exit 0, all 12 routes compiled |
| Linting in build | ✅ Passed |

> Note: An intermittent `unhandledRejection: PageNotFoundError: Cannot find module for page: /_document` appeared on the first build attempt but not subsequent ones. Likely a race condition in the cold build cache. Monitor on first deployment build.

---

## DEPLOY BLOCKERS

Things that MUST be fixed before deploying.

---

### B1 — `/privacy` and `/terms` routes 404

**Impact:** First-time users see broken links on the sign-in page.

`AuthShell` (rendered on `/sign-in` and `/sign-up`) links to both routes:
```tsx
<Link href="/privacy" className="text-[12px] text-white/20">Privacy</Link>
<Link href="/terms" className="text-[12px] text-white/[0.15]">·</Link>
<Link href="/terms" className="text-[12px] text-white/20">Terms</Link>
```

Neither `app/privacy/` nor `app/terms/` exists. Both are correctly whitelisted in `middleware.ts` as public routes, but there are no actual pages behind them. A demo client clicking either link on the first screen they see hits a Next.js 404.

**Fix:** Create minimal `app/privacy/page.tsx` and `app/terms/page.tsx` pages, or remove the links from AuthShell until the pages are ready.

---

### B2 — `CRON_SECRET` missing from `.env.example`

**Impact:** Any new deployment environment (staging, a second host, handing to a client) will fail to protect the cron route.

`app/api/cron/overdue-invoices/route.ts:11` uses `process.env.CRON_SECRET` to gate the endpoint. It is **not listed** in `.env.example`. The `.env.example` documents all Supabase, Clerk, Resend, and Sentry variables — but not `CRON_SECRET`.

```ts
if (!token || token !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Without this variable set, the cron endpoint will reject all requests from the actual cron runner.

**Fix:** Add `CRON_SECRET=` to `.env.example` with a comment like `# Random string; must match the Authorization header sent by your cron runner`.

---

## SHOULD FIX

Won't crash the app but will make the demo look broken or unprofessional.

---

### S1 — BrandGuideTab fires a server action (and success toast) on every keystroke

**File:** `components/clients/BrandGuideTab.tsx:87,99`

All text and textarea fields call `handleSave` in `onChange`:
```tsx
// textarea fields:
onChange={(e) => handleSave(field.key, e.target.value)}

// text fields:
onChange={(e) => handleSave(field.key, e.target.value)}
```

`handleSave` immediately calls `updateClientBrandGuide` (a Supabase write) AND fires `toast.success("Brand guide saved")`. Typing "Hello" in a brand guide text field triggers 5 Supabase writes and 5 success toasts in rapid succession. During a demo, this will look extremely broken — the screen fills with green toasts while the user types.

**Fix:** Debounce the `handleSave` call (e.g. 800ms), or switch to `onBlur` save semantics (blur = save, matching what the `Textarea` field in NotesTab does).

---

### S2 — NotesTab saves on any focus-out from the add-note textarea

**File:** `components/clients/NotesTab.tsx:229`

```tsx
<Textarea
  placeholder="Add a private note..."
  onBlur={handleSave}    // ← fires whenever focus leaves the textarea
  ...
/>
```

`handleSave` guards against empty body (`if (!body.trim() ...)`), so blank saves are safe. However, if a user starts typing a note, then clicks the edit pencil icon on an existing note (or clicks a tab), `handleSave` fires and saves the partial text as a note without the user pressing Cmd+Enter. During a demo walkthrough this is easily triggered.

**Fix:** Remove `onBlur={handleSave}`. The existing `Cmd+Enter` / `Ctrl+Enter` keyboard shortcut is sufficient. Consider adding an explicit "Save" button as a fallback.

---

### S3 — `updateClientNote` revalidates the wrong path

**File:** `lib/clients/actions.ts:296`

```ts
// updateClientNote
revalidatePath('/clients');         // ← revalidates the CLIENT LIST
// missing: revalidatePath(`/clients/${clientId}`);
```

Compare with `deleteClientNote` (line 320) which correctly does `revalidatePath('/clients/${params.clientId}')`. After editing a note, the Client 360 detail page server cache is **not** invalidated. The component uses local state optimistically so the edit appears correct during the session, but a hard refresh immediately after an edit shows the old note text.

Also: `archiveClient` (line 119–121) revalidates `/clients`, `/`, `/analytics` but not `/clients/${clientId}` — the archived client's detail page remains cached as active.

**Fix:**
- In `updateClientNote`: add `revalidatePath('/clients/${params.clientId}')` (note: `clientId` needs to be added to the params).
- In `archiveClient`: add `revalidatePath('/clients/${params.clientId}')`.

---

### S4 — No `<title>` or metadata — browser tab shows raw URL

**File:** `app/layout.tsx`

There is no `export const metadata` in `app/layout.tsx` or any layout. The browser tab will display the URL or "localhost:3000" during the demo rather than an app name.

**Fix:** Add to `app/layout.tsx`:
```ts
export const metadata = {
  title: 'Severl',
  description: 'Social media management OS for agencies',
};
```

---

### S5 — No favicon

**File:** `public/`

The `public/` directory contains `SeverlLogo.png` and `bg.mp4` but no `favicon.ico`, `favicon.png`, or `icon.png`. The browser will show its default globe/document favicon. For a client-facing demo this looks unfinished.

**Fix:** Add `favicon.ico` (or `app/icon.png` which Next.js will auto-serve as `/favicon.ico`). The `SeverlLogo.png` in `public/` can be converted/used directly.

---

## NICE TO HAVE

Can ship without these but worth noting.

---

### N1 — "Cmd+Enter to save" hint is Mac-only

**File:** `components/clients/NotesTab.tsx:233`

```tsx
<div className="mt-1.5 text-right text-[12px]...">
  Cmd+Enter to save
</div>
```

The keyboard handler correctly responds to both `e.metaKey` (Mac) and `e.ctrlKey` (Windows/Linux), but the visible hint says "Cmd+Enter" only. A Windows user won't know to use Ctrl+Enter.

**Fix:** Change to "⌘/Ctrl+Enter to save" or use a platform-detection approach.

---

### N2 — `isPending` from `useTransition` unused in StatusBoard — no drag lockout

**File:** `components/deliverables/StatusBoard.tsx:109`

```tsx
const [isPending, startTransition] = useTransition();
```

`isPending` is never read. This means if a user drags a card quickly while a status update is in flight, a second drag-and-drop will fire another server action before the first completes. No visual lockout or `disabled` state exists during the transition. Flagged by `tsc --noUnusedLocals`.

---

### N3 — Dashboard doesn't render the `firstName` prop

**File:** `components/dashboard/DashboardClient.tsx:225`, `app/(dashboard)/page.tsx:17`

`firstName` is fetched from Clerk, passed as a prop to `DashboardClient`, and destructured — but never rendered. The dashboard shows no personalized greeting. Flagged by `tsc --noUnusedLocals`.

---

### N4 — `archiveClient` doesn't revalidate the client detail page

**File:** `lib/clients/actions.ts:103–122`

After a client is archived from the Client 360 page, the page itself is not revalidated (only `/clients`, `/`, and `/analytics` are). On a subsequent visit to the same client URL the page may render stale "active" data until the cache expires.

---

### N5 — Hardcoded colors in some UI components are outside the design token system

**Scope:** `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/textarea.tsx`

These shadcn primitive wrappers use hardcoded hex values (`#1e1e1e`, `rgba(255,255,255,0.05)`, `rgba(74,222,128,0.40)`) rather than CSS custom properties. This is a known shadcn pattern and does not affect the demo visually, but makes future theme changes harder.

---

## VERIFIED CLEAN

Areas that passed all checks:

| Area | Status |
|---|---|
| **Build** | ✅ Clean exit 0, all routes emitted |
| **TypeScript** (`tsc --noEmit`) | ✅ 0 errors |
| **All 10 dashboard routes** | ✅ Exist and compile |
| **API routes** (`/api/invoices/[id]`, `/api/cron/overdue-invoices`) | ✅ Exist |
| **Middleware auth** | ✅ All non-public routes call `auth.protect()` |
| **Cron route auth** | ✅ Uses CRON_SECRET bearer token (in addition to public whitelist) |
| **`.env.example` vs code** | ✅ All 9 documented vars referenced correctly (except CRON_SECRET — see B2) |
| **No placeholder/TODO text in UI** | ✅ Only `SeverlLogo.tsx` has a non-visible code comment TODO |
| **Fonts** | ✅ Poppins loaded via `next/font`, set on Clerk, Toaster, and body |
| **All server actions: `requireOrgAccess` first** | ✅ Confirmed across all 6 action files |
| **All server actions: Sentry error capture** | ✅ Present in all action files |
| **All interactive actions: success toast** | ✅ Every mutation path has `toast.success(...)` |
| **All interactive actions: error toast** | ✅ Every mutation path has `toast.error(...)` |
| **All interactive actions: `useTransition` or `useOptimistic`** | ✅ Loading state present on every form |
| **Empty states** | ✅ All 9 scenarios covered (dashboard, clients, deliverables, invoices, analytics, notes, deliverables tab, invoices tab) |
| **No stale Sheet components** | ✅ `sheet.tsx` still in use by InvoicesClient (mark-paid flow) — intentional |
| **No hardcoded mock/test data** | ✅ None found |
| **All data-fetching functions have call sites** | ✅ None orphaned |
| **Privacy/terms in middleware** | ✅ Listed as public (but pages missing — see B1) |
| **CloseOutDialog** | ✅ 3-step flow complete, `isPending` used, success toast, `router.refresh()` |
| **BatchBillingDialog** | ✅ Loading state, success/error toasts, `router.refresh()` |
| **InvoicesClient** | ✅ Optimistic updates via `useOptimistic`, Sheet-based mark-paid flow intact |
| **StatusBoard drag-and-drop** | ✅ DnD wired, `updateDeliverableStatus` called on drop |
| **NotesTab CRUD** | ✅ Local optimistic state + server sync + Undo on error |
| **TeamManagementDialog** | ✅ Controlled/uncontrolled modes both work, all 4 actions wired |

---

## GO / NO-GO

**⚠️ CONDITIONAL GO**

The app builds cleanly, has zero TypeScript errors, all routes are functional, all server actions are properly guarded, and the core feature set is complete. However:

**Must fix before demo:**
1. **B1** — Create stub `/privacy` and `/terms` pages (5 min fix). A client clicking "Privacy" on the sign-in screen hitting a 404 is the worst possible first impression.
2. **B2** — Add `CRON_SECRET` to `.env.example` (1 min fix) to protect the deployed environment.

**Strongly recommended before demo:**
3. **S1** — Fix BrandGuideTab onChange to debounce (visible toast spam every keystroke is jarring).
4. **S4 + S5** — Add metadata title and favicon (2 min fix each; absence is immediately visible in the browser tab).

With B1 and B2 fixed: **GO for demo deployment.** With S1, S4, and S5 also addressed: **confident GO.**

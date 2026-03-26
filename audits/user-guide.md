# Severl — User Guide

**Severl** is your social media management operating system. It helps freelancers and agencies track clients, deliverables, invoices, and revenue — all in one place.

---

## Getting Started

1. **Sign up** at `/sign-up` and verify your account.
2. On first login you'll be taken to **Onboarding** — enter your business name and pick your account type:
   - **Freelance** — for solo social media managers
   - **Agency** — for teams (unlocks team management and assignees)
3. You're in. The dashboard is your home base.

---

## Dashboard (`/`)

Your live overview of the business.

- **KPI strip** — MRR, active client count, and deliverables behind schedule
- **Alert strip** — flags overdue invoices, at-risk clients, and upcoming renewals
- **MRR trend sparkline** — see how monthly recurring revenue is moving
- **Upcoming renewals** — clients with contracts renewing soon
- **Recent invoices** — latest invoice activity
- **Deliverables this week** — what's due in the next 7 days
- **Ticker bar** — scrolling live metrics at the bottom of the screen
- Greets you by first name based on the time of day

---

## Clients (`/clients`)

Your full client roster.

- **Search** clients by name
- **Filter** by lifecycle status (e.g. Active, Onboarding, At Risk, Churned)
- **Add a client** — click the add button to create a new client with retainer, platforms, and renewal date
- **Click any client** to open their full profile (Client 360)

### Client 360 (`/clients/[id]`)

A deep profile page with multiple tabs:

| Tab | What it shows |
|---|---|
| **Overview** | Retainer amount, platforms, renewal countdown, activity timeline |
| **Deliverables** | All deliverables for this client |
| **Invoices** | Invoice history for this client |
| **Notes** | Add, edit, and delete internal notes (save with the Save button or `Cmd/Ctrl + Enter`) |
| **Brand Guide** | Brand colours, fonts, voice, and other assets (blur a field to save) |
| **Team** *(agency only)* | Assigned team members |

**Renewal Countdown** — shows days until the contract renews with the option to update the renewal date inline.

---

## Deliverables (`/deliverables`)

Track every piece of content you're producing, organised by month.

- **Month navigation** — step forward/backward through months
- **Two views:**
  - **By Client** — deliverables grouped under each client with a progress bar
  - **Kanban board** — drag cards across columns: `Not Started → In Progress → In Review → Scheduled → Published`
- **Add a deliverable** — inline add row under each client section
- **Status dropdown** — change status directly from the list or kanban view
- **Month Close-Out** — at the end of the month, use the close-out dialog to confirm completion per client before moving on

---

## Invoices (`/invoices`)

Manage billing for all your clients.

- **Invoice list** — see all invoices with status badges: `Draft`, `Sent`, `Paid`, `Overdue`, `Void`
- **Summary strip** — total outstanding, total paid, and overdue amounts at a glance
- **Create a single invoice** — use the Create Invoice button to make a retainer, project, or ad spend invoice for any client
- **Batch billing** — generate retainer invoices for all active clients in one click (saves hours at the start of each month)
- **Invoice actions:**
  - **Mark as Sent** — records the send date (can trigger an email to the client if they have an email on file)
  - **Mark as Paid** — closes out the invoice
  - **Void** — cancel an invoice without deleting it
- **Print / Save as PDF** — open any invoice at `/api/invoices/[id]` to get a clean, printable version

---

## Analytics (`/analytics`)

Business performance at a glance.

- **MRR trend** — monthly recurring revenue over time (current month uses live retainer data until the month closes)
- **Revenue by client** — see which clients contribute most
- **Renewal pipeline** — upcoming contract renewals and their value
- **Delivery rate by client** — how consistently you're hitting deadlines per client

> Agency accounts: team capacity metric is coming soon.

---

## Team Management *(Agency only)*

Found inside `/clients/[id]` on the Team tab, and accessible via the Team Management dialog.

- **Add team members** — invite members to your org
- **Edit or remove members** — keep your roster up to date
- **Assign deliverables** to specific team members

---

## Navigation

The **left sidebar** gives you quick access to all sections:
- Home (Dashboard)
- Clients
- Deliverables
- Invoices
- Analytics

The **top bar** shows the current page title, today's date, and a live indicator.

Your **account menu** (bottom of sidebar) lets you manage your Clerk profile, sign out, and switch settings.

---

## Tips

- **Notes** are saved when you click Save or press `Cmd/Ctrl + Enter` — there's no auto-save on notes.
- **Brand Guide** fields save automatically when you click out of them (blur-to-save).
- The **batch billing** flow is the fastest way to invoice all your retainer clients at month-start.
- Use **filters + search** on the clients page to find clients quickly as your roster grows.
- **Overdue invoices** are automatically flagged by a scheduled job — no manual chasing needed.

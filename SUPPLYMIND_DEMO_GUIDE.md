# SupplyMind Demo Guide

_As of 2026-09-18 · Prepared for the demo team_

A prep guide to understand the client, the domain, SAP, and the SupplyMind app well enough to give a confident demo.

---

## 1. What SupplyMind is — and why this demo

SupplyMind is a live, AI-powered Procurement & Inventory MIS (Management Information System) for Bajaj Energy: it turns SAP data into one interactive dashboard, plus a chatbot that answers supply-chain questions in plain language.

- **The client.** Bajaj Energy Ltd together with Lalitpur Power Generation Co (LPGCL) — the largest private thermal power producer in Uttar Pradesh, ~2,430 MW. Their system of record is SAP ECC 6.0 EHP8, hosted on AWS.
- **The problem today.** Their procurement and inventory MIS is built by hand in Excel — coal-stock reports, PR/PO status, vendor performance, stock statements — copied out of SAP screens, consolidated manually, a day or more old, and hard to slice by plant or period.
- **What SupplyMind does.** One always-current dashboard (spend, coal stock days, PO cycle time, inventory value, critical spares), drill-down on every chart and table, demand forecasting, ready-made monthly reports, and an AI assistant that answers in SAP terms.
- **The goal of THIS demo.** Win senior approval to proceed to real SAP integration. Everything you show runs on realistic **sample data** modelled on their real fleet, so a SAP-literate senior can picture their own live data in its place.

**Open with this line:** "This is your MIS, live — the same numbers your team makes in Excel, but always current and one click deep."

---

## 2. Know the client: Bajaj Energy & LPGCL

Bajaj Energy runs coal-fired thermal power plants. A plant burns coal to make steam, the steam spins a turbine, and the turbine drives a generator that sends electricity to the grid — so **coal is the lifeblood**, and running out of coal means the plant stops. That single fact drives most of what this MIS watches.

**Two units — this is why the dashboard has a Unit filter:**

| Unit | Plants | Capacity | Note |
| --- | --- | --- | --- |
| LPGCL — Lalitpur | Lalitpur (1 site, 3 units) | 3 × 660 MW supercritical | Large, modern; **acquired** by the group |
| Bajaj Energy | Barkhera, Maqsoodapur, Khambarkhera, Kundarkhi, Utraula | 5 × 90 MW | Five smaller plants at different locations |

So "Bajaj Energy" and "Lalitpur/LPGCL" are **two different companies** the group owns — Lalitpur was bought in. Bajaj Energy itself is spread across five locations. The dashboard lets you filter by Unit first, then by an individual plant/location.

**How they make (or lose) money — what a senior cares about:**

- **Generation** (how many units of power they sold) vs **PLF** (how hard the plants ran). More coal problems or breakdowns → lower PLF → lost revenue.
- **Coal cost is ~80%+ of procurement spend.** Small % savings on coal = large rupees. Coal comes by railway **rakes** from Coal India subsidiaries (NCL, CCL, SECL) and imported coal (Adani).
- **A single critical spare** (turbine blade, boiler feed pump part) out of stock can force a unit to shut — far costlier than the part itself.

**Their real pain points (the ones SupplyMind removes):**

1. Coal-stock-days tracked in spreadsheets, plant by plant, often a day late.
2. No single view of PR/PO status, vendor delays, or money stuck in pending approvals.
3. Critical-spare shortages spotted too late; excess/dead stock sitting unnoticed.
4. Every monthly MIS report re-built by hand in Excel from SAP downloads.

---

## 3. Domain glossary (learn these to sound credible)

Know these cold — they are the words on the screens and the words seniors use.

| Term | Plain meaning | Why it matters here |
| --- | --- | --- |
| PLF (Plant Load Factor) | How much a plant actually generated vs its full capacity, as a % | The headline "utilisation" number for a power plant |
| Generation (MU) | Electricity produced, in Million Units (MU = million kWh) | The output they sell; compared against plan |
| Coal stock days | How many days the plant can run on the coal in yard | The #1 inventory KPI; below norm = risk of shutdown |
| CEA norm | Central Electricity Authority guideline (≥ ~12 days coal stock) | The benchmark red line on the coal chart |
| Rake | One full trainload of coal (~59 wagons, ~4,000 MT) | Coal arrives in rakes; "rakes short by 4/day" = shortfall |
| GAR / GCV / Grade | Coal quality — energy content per kg; grades G1–G17 | Drives price and how much you must burn |
| PR (Purchase Requisition) | Internal request to buy something | Start of the buying cycle (SAP table EBAN) |
| PO (Purchase Order) | The actual order placed on a vendor | The commitment to spend (SAP EKKO/EKPO) |
| GRN (Goods Receipt) | Recording that goods arrived | Confirms delivery (SAP MIGO → MKPF/MSEG) |
| MIRO (Invoice) | Booking the vendor's invoice for payment | Last step before paying |
| PR→PO→GRN→MIRO | The full "Procure-to-Pay" (P2P) cycle | The backbone of the Procurement page |
| Safety stock | Minimum buffer you always keep | Falling below it triggers an alert |
| Reorder point (ROP) | Stock level at which you must reorder | Below ROP = "reorder now" |
| Days of supply | How long current stock will last at usage rate | Stock health in time, not just quantity |
| ABC / XYZ | ABC = value (A=high); XYZ = demand steadiness (X=stable) | Focus control on A-items and erratic Z-items |
| VED | Vital / Essential / Desirable (criticality) | A cheap Vital spare can still stop a plant |
| FSN | Fast / Slow / Non-moving | Finds dead stock and overstock |
| Dead / non-moving stock | Items with no movement > 12 months | Money frozen on the shelf |
| MSME dues | Money owed to small/micro suppliers | Legal 45-day payment rule; compliance risk |
| Bank Guarantee (BG) | Vendor's bank-backed security, has an expiry | Expiring BGs need action |
| MAPE | Mean Absolute % Error — forecast accuracy (lower = better) | The forecasting quality score |

---

## 4. SAP & the integration story

**What SAP is, in one line:** SAP ECC is the client's core business software — the single source of truth where every purchase order, goods receipt, material and stock balance is recorded. **SAP MM (Materials Management)** is the module that covers procurement and inventory — exactly what SupplyMind reports on.

**How SupplyMind will connect (say this plainly):** SupplyMind reads from SAP on a schedule (for example a nightly full sync plus hourly deltas), copies the data into its own database, and the dashboard runs on that copy. It is **read-only in Phase 1** — SupplyMind never writes back into SAP, so there is zero risk to their live system. Connectivity is over a secure private link (VPN/ExpressRoute) or a secured SAP OData service, with a service account limited to the tables below.

**The tables it maps to** — this is the slide that makes SAP-literate seniors trust it. It is also built into the app's **SAP Mapping** page.

| SupplyMind shows | SAP source (MM) |
| --- | --- |
| Purchase orders, spend, open POs | EKKO / EKPO (PO header/item) |
| Purchase requisitions, PR aging | EBAN |
| Delivery dates / schedule | EKET |
| GR / PO history | EKBE |
| Stock on hand by storage location | MARD (LABST unrestricted, blocked, QI) |
| Reorder point & safety stock | MARC (MINBE, EISBE) |
| Stock valuation | MBEW (SALK3 value, price) |
| Material movements (GR/GI/scrap) | MKPF / MSEG (movement type BWART: 101 GR, 261 GI, 551 scrap) |
| Material master & descriptions | MARA / MAKT |
| Vendor master | LFA1 |

**When a senior asks "How does this talk to our SAP?" answer:** "A read-only service account pulls these MM tables on a schedule over a secure link. We stage the data on our side and report from it, so there is no load risk and no change to your SAP. Nothing writes back in Phase 1 — write-back (raising a PR from here) is a later, separately-approved phase."

**Honest framing for today:** the numbers on screen are realistic **sample data** shaped to their fleet. The integration is designed and the field mapping is done; wiring it to live SAP is the approved next step.

---

## 5. The application, page by page

Two things work on **every** page — lead with them once, then they impress by themselves everywhere:

- **Filters (top of page):** **Unit → Location** and **Month / Quarter / Year / date range**. Change a filter and the whole page — KPIs, charts, tables — recalculates. Show LPGCL vs Bajaj Energy, then one plant.
- **Click to drill down:** every chart bar and every table can be clicked or "Explored" to open a detail view with **search, column filters, sort and export to Excel/PDF**. This is the answer to "real SAP data will be huge" — you can always find and pull the exact rows.

**Left sidebar — what each page is for:**

- **Login.** Clean sign-in. Say: "Role-based — each user sees only what they're allowed."
- **Procurement MIS.** Spend, coal spend share, PO cycle time, rake OTIF, open POs, budget vs actual, savings, vendor scorecard, PR/PO aging, contract & BG expiry, MSME dues. _Click:_ Spend-by-Plant bar → that plant's open POs; Budget-vs-Actual bar → variance. _Talking point:_ "Every rupee of committed spend, one click from the PO detail." Maps to SAP EKKO/EKPO/EBAN/LFA1.
- **Inventory MIS.** Inventory value, coal stock days by plant (vs CEA norm), turnover, below-safety items, ABC/XYZ, VED, FSN, aging, dead stock, scrap, critical spares. _Click:_ an ABC/XYZ cell → the items in it; the coal chart → per-plant detail. _Talking point:_ "Coal-stock-days risk and dead stock, live, without a single Excel." Maps to MARD/MARC/MBEW/MSEG.
- **Forecasting.** Demand forecast per material with a 95% confidence band, stock-out prediction, and AI-recommended safety stock vs the SAP value, with an accuracy (MAPE) score. _Talking point:_ "Not just what happened — what to order next, and when it will run out."
- **Operational Reports.** The monthly MIS pack as ready reports (stock statement, consumption vs budget, PO/GRN registers, vendor performance, payment ageing, MSME, management scorecard) — each opens full-width with search, month filter and export. _Talking point:_ "The reports your team builds by hand each month — already made, filterable, exportable."
- **SAP Mapping.** The table from Section 4, on screen: each dashboard figure ↔ its SAP MM table/field. _Talking point (to the SAP person):_ "Here is exactly where each number comes from in your SAP."
- **What-If.** Change an assumption (e.g. coal price, lead time) and see the impact — a planning sandbox.
- **Knowledge Bot.** The AI assistant (see Section 6).
- **Connectors.** Cards for SAP ECC, SQL, Oracle, cloud storage with a "Connect" flow — shows _how_ integration will be set up. Say: "Demo of the connect experience; real wiring is the next phase."
- **Admin.** Add users, set page/permission access, see who created whom, audit trail; every user can change their own password. _Talking point:_ "IT stays in control — roles, permissions, and an audit trail."

---

## 6. The AI assistant (the showstopper)

The Knowledge Bot answers supply-chain questions in plain English **using the live dashboard data and SAP terminology** — and it can read a PDF you give it. This is usually the moment seniors lean in, so rehearse it.

**Why it lands:** a manager can just _ask_ — no report-building, no SAP navigation — and get an answer with the number, the insight, and a suggested action, often as a small table or chart. It even names the SAP tables behind the answer.

**Strong questions to ask on stage (pick 3–4):**

1. "Which plants are below the CEA coal-stock norm, and by how much?"
2. "Show me the top 5 vendors by spend and their on-time %."
3. "Which critical spares are below safety stock right now?"
4. "What's my open PO value and which POs are overdue?"
5. "Where is money stuck in pending approvals?"
6. "Which contracts and bank guarantees expire in the next 30 days?"
7. "Which SAP tables does the coal-stock number come from?" (shows SAP fluency)
8. "Summarise this month's procurement risks in 3 bullets."

**The PDF trick:** upload a sample contract or policy PDF (paperclip icon) and ask, e.g., "What is the penalty clause and delivery timeline in this contract?" It answers from the document. Message: "It reads your documents too, not just SAP data."

**Tip:** ask questions you've tried before — don't improvise a brand-new one live. Keep a couple of known-good ones ready.

---

## 7. Suggested demo flow (15–20 min runsheet)

Follow this order; each step says what to do and what to say.

1. **Set the problem (1 min).** "Today your MIS is built by hand in Excel from SAP — a day old and hard to slice. Here it is live."
2. **Log in (30 sec).** "Role-based access — each user sees only their pages."
3. **Procurement dashboard (3 min).** Walk the KPI tiles. Then **change the Unit filter** (LPGCL → Bajaj Energy → one plant) and the **period** — show the whole page recalculating. "Any unit, any month, instantly."
4. **Drill down (2 min).** Click a **Spend-by-Plant** bar → its open POs; open the vendor scorecard; hit **Explore** → search, filter, **export to Excel**. "Real SAP data is huge — you can always pull the exact rows."
5. **Inventory (3 min).** Coal-stock-days vs the CEA red line; below-safety spares; click an **ABC/XYZ** cell → its items; show dead stock. "Shutdown risk and frozen money, live."
6. **Forecasting (2 min).** Show the demand forecast with its confidence band and the recommended safety stock. "What to order next, and when it runs out."
7. **AI assistant (3 min) — the highlight.** Ask 3 prepared questions (Section 6), then the SAP-tables one, then upload a PDF and ask about it.
8. **Reports (1 min).** Open one monthly report full-width; filter by month; export. "Your month-end pack, already built."
9. **SAP Mapping (1 min).** "Every number, mapped to its SAP MM table — read-only, no risk to your system."
10. **Admin / Connectors (1 min).** Roles, audit trail, and the SAP connect flow. "IT stays in control; this is how we'll wire it up."
11. **Close (1 min).** "This runs on realistic sample data today. Approve, and the next step is connecting it to your live SAP." Then hand over the cost numbers (Section 9).

**Golden rules:** navigate with the in-app sidebar (don't hard-refresh the page); keep to prepared AI questions; if anything is slow, keep talking and it will catch up.

---

## 8. Anticipated questions & answers

Have these ready — short, confident, honest.

| They ask | You answer |
| --- | --- |
| Is this our real SAP data? | "Not yet — it's realistic sample data shaped to your fleet. The design and the field-level SAP mapping are done; connecting live SAP is the approved next step." |
| Will it disturb / slow our SAP? | "No. It's read-only, on a scheduled sync, via a limited service account. We stage data on our side and report from the copy — no load, no change to SAP." |
| Can it write back to SAP (raise a PR/PO)? | "Not in Phase 1 — read-only by design. Write-back is a later, separately-approved phase with proper controls." |
| How secure is it? | "Role-based access, audit trail, encrypted transport, private connectivity to SAP, least-privilege service account. Each user sees only their pages." |
| How long to integrate? | "Weeks, not months, for the read-only MM sync — the mapping is already built. Exact timeline after a short scoping of your SAP setup." |
| Does it handle both units / all plants? | "Yes — LPGCL and Bajaj Energy as separate units, and every plant/location, with a Unit → Location filter across the whole dashboard." |
| What if SAP is down at sync time? | "The dashboard keeps showing the last good sync and simply catches up on the next run — no gap for the user." |
| Is the AI accurate / does it invent numbers? | "It answers from the actual dashboard data and cites the SAP source. It reports the numbers, not guesses." |
| What does it cost to run? | Hand over Section 9 — roughly ₹11k–41k/month for 20 users depending on the setup. |
| Who maintains it? | "We do — hosting, updates and support. Your IT keeps control of SAP access and user roles." |

**If you don't know an answer:** "Good question — let me confirm the exact detail and come back, rather than guess." That builds more trust than bluffing.

---

## 9. Cost & commercials

Monthly Azure running cost (list price; ≈₹85/$). Keep these numbers in your pocket for the close.

| Scenario | What it covers | ~USD/mo | ~INR/mo |
| --- | --- | --- | --- |
| Demo (today) | App Service B1, Postgres B1ms, free Static Web App | ~$35–45 | ~₹3,000–3,800 |
| Prod — lean (20 users) | B2 compute, Burstable DB, SAP over secured OData (no VPN) | ~$127 | ~₹10,800 |
| Prod — recommended (20 users) | P1v3, GP Postgres, VPN link to SAP, monitoring | ~$485 | ~₹41,000 |
| + High availability (optional) | Zone-redundant DB + 2nd app instance | +$255 | +₹21,700 |

**Main cost drivers to know:**

- **20 users is a light load** — cost is driven by production posture (high availability, monitoring), not user count.
- **The secure SAP link is the biggest swing.** A VPN/ExpressRoute adds ~$140/mo; if SAP OData can be reached over a secured public endpoint with IP allow-listing, the recommended build drops to ~$345/mo (~₹29,000).
- **AI tokens are tiny** — about $15/mo for 20 users (gpt-4o-mini, pay-per-use, no idle cost).
- **Not included:** SAP-side licensing for data access, and any AWS egress on the client's side.

**One-line answer for a senior:** "Budget roughly ₹11k/month lean to ₹41k/month for a secure, monitored 20-user production — tokens are negligible; the compute and the secure SAP link are the cost."

---

## 10. Quick reference card

**App URL:** https://wonderful-grass-0e5518e0f.7.azurestaticapps.net _(open the app here — not supplymind.rightleft.ai, that's a different site)._

**Demo login:** planner@bajajenergy.com  /  Bajaj@1234

**Five things to never forget on stage:**

1. Navigate with the **in-app sidebar** — don't hard-refresh (it can force a re-login).
2. Show the **Unit → Location** and **period** filters early — that's the "live" wow.
3. **Click a chart / Explore a table** — drill-down + Excel export is the killer feature.
4. Ask only **prepared** AI questions; have the PDF ready for the upload trick.
5. Be honest it's **sample data**; the SAP mapping is done and integration is the next step.

**Elevator pitch (memorise):** "SupplyMind is your live procurement & inventory MIS — the Excel reports your team makes by hand, always current, one click deep, and answerable in plain English. It reads from SAP, safely and read-only."

**Prep checklist before the meeting:** confirm you can log in, click through each page once, run your 3–4 AI questions, and have a sample contract PDF on the desktop.

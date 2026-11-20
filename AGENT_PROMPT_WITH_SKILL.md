# Marketpeace AI Agent Deployment + Location/Events Management

---

## PART 1: DEPLOYMENT PROMPT

**Objective:** Fork `https://github.com/isiraglobal/Marketpeace-FA` → create `marketpeace` repo under your account → deploy to Vercel → configure Stripe webhook → deploy Google Apps Script → verify all endpoints.

**Source Repo:** `https://github.com/isiraglobal/Marketpeace-FA` (branch: `main`)
**Target Repo:** `marketpeace` (private, under your GitHub account)

---

### Environment Variables for Vercel (Production + Preview + Development)

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` / `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` (update after Apps Script deploy) |
| `INTERNAL_WEBHOOK_SECRET` | `[32-char base64]` |
| `ADMIN_ID` | `[admin username]` |
| `ADMIN_PASS` | `[admin password]` |
| `APP_URL` | `https://[vercel-project].vercel.app` (update after Vercel deploy) |

### Apps Script Script Properties (must match)

| Property | Value |
|----------|-------|
| `INTERNAL_SECRET` | **Exact match** of `INTERNAL_WEBHOOK_SECRET` |
| `STRIPE_SECRET_KEY` | Same as Vercel |
| `DISCORD_WEBHOOK_URL` | `[your Discord webhook]` |
| `NVIDIA_NIM_API_KEY` | `[your NVIDIA NIM key]` |
| `VENUE_WEBHOOK_URL` | `[your venue webhook]` |

---

### Execute Deployment

1. **Create repo & mirror source:**
   ```bash
   gh repo create marketpeace --private --clone=false
   git clone --bare https://github.com/isiraglobal/Marketpeace-FA.git
   cd Marketpeace-FA.git && git push --mirror https://github.com/YOUR_USERNAME/marketpeace.git
   cd .. && rm -rf Marketpeace-FA.git
   ```

2. **Deploy to Vercel via GitHub integration** (link repo, framework: Vite, auto-deploy on push)

3. **Add all 7 env vars in Vercel dashboard** (Settings → Environment Variables → Production + Preview + Development)

4. **Configure Stripe webhook:** `https://[vercel-url]/api/stripe-webhook` → events: `checkout.session.completed` → copy signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel

5. **Deploy Apps Script:** New project → paste `infrastructure/backend_apps_script.js` → Script Properties (5 values above) → Deploy as Web App (Me, Anyone) → copy URL → update `GOOGLE_SCRIPT_URL` in Vercel → run `setupSheets` → run `setupTriggers`

6. **Verify:**
   ```bash
   curl https://[vercel-url]/api/cities
   curl -X POST https://[vercel-url]/api/admin/login -H "Content-Type: application/json" -d '{"id":"test","password":"test"}'
   curl -X POST https://[vercel-url]/api/stripe-webhook
   curl -X POST https://[vercel-url]/api/submit -H "Content-Type: application/json" -d '{"type":"CityRequest","name":"Test","email":"test@test.com","phone":"1234567890","city":"TestCity","state":"TS","country":"Test"}'
   ```
   Visit `/admin` → login → add test city → verify on `/cities`

**Critical:** `INTERNAL_WEBHOOK_SECRET` (Vercel) = `INTERNAL_SECRET` (Apps Script) character-for-character. `APP_URL` = Vercel production domain. `GOOGLE_SCRIPT_URL` = Apps Script deployment URL.

---

## PART 2: SKILL — MARKETPEACE LOCATIONS & EVENTS MANAGEMENT

### Purpose
This skill provides AI agents with exact patterns to safely manage Marketpeace **locations (cities)** and **events** without breaking the data pipeline or UI.

---

### Data Flow (Critical — Read First)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOCATIONS (Cities)                                                     │
│  Google Sheets (Cities tab)                                             │
│    → Google Apps Script (handleGetCities / handleUpdateCities)         │
│      → Vercel API (/api/cities GET, /api/admin/cities POST)            │
│        → Frontend (src/pages/Cities.jsx, src/pages/Admin.jsx)          │
├─────────────────────────────────────────────────────────────────────────┤
│  EVENTS                                                                 │
│  Google Sheets (Events tab)                                             │
│    → Google Apps Script (handleGetDash reads Events, cronCapacityCheck)│
│      → Vercel API (/api/admin/dashboard GET)                           │
│        → Frontend (src/pages/Admin.jsx dashboard)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  CITY REQUESTS (Public)                                                 │
│  src/pages/Cities.jsx form → /api/submit (type: CityRequest)           │
│    → Google Apps Script (handleSubmit) → Google Sheets (Contacts tab)  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Never edit frontend data directly.** All city/event data lives in Google Sheets. The frontend only displays what the API returns.

---

### Google Sheets Schemas

#### Cities Tab (Source of Truth for Locations)
```
Columns: Name | Status | Date | LastUpdated
Status values: "Active" | "Planned" | "Completed" | "Cancelled"
```

#### Events Tab (Source of Truth for Events)
```
Columns: Timestamp | EventName | City | Venue | EventDate | Capacity | SoldCount | NotifiedAt | BalanceDueAt | Status | LastUpdated
Status values: "Scheduled" | "Active" | "Completed" | "Cancelled"
```

#### Contacts Tab (City Requests from Public)
```
Columns: Timestamp | Name | Email | Phone | Subject | Message | Source | Replied | Notes | LastUpdated
Subject: "City Request"
Source: "Website"
```

---

### Files That Control Locations & Events

| Change Type | Files to Edit | Do NOT Touch |
|-------------|--------------|--------------|
| Add/edit/delete cities (admin) | Google Sheets (Cities tab) ONLY, or Admin panel at `/admin` | Frontend components, API routes |
| User requests new city (public) | `src/pages/Cities.jsx` form → `/api/submit` (type: CityRequest) → Google Sheets (Contacts tab) | Cities sheet, Cities API |
| Change city display fields | `src/pages/Cities.jsx` (CityNode component) | API response structure |
| Change admin city editor columns | `src/pages/Admin.jsx` (table columns) | Google Sheets schema |
| Add new city properties | 1. Google Sheets headers → 2. Apps Script `handleGetCities` → 3. API sanitization → 4. Frontend components | Any single layer in isolation |
| Add/edit/delete events | Google Sheets (Events tab) ONLY | Frontend, API routes (no event CRUD API exists yet) |
| Change event display in dashboard | `src/pages/Admin.jsx` (DashCard components) | Apps Script `handleGetDash` |

---

### Frontend Components

#### `src/pages/Cities.jsx` (Public Cities Page)
- Fetches from `/api/cities` on mount
- Renders `CityNode` components in a grid
- **CityNode** (lines 226-234): receives `name`, `status`, `date` props
- **City Request Form** (lines 99-220): submits to `/api/submit` with `type: 'CityRequest'`
- To change display: edit the `CityNode` component only

#### `src/pages/Admin.jsx` (Admin Panel)
- Authenticated at `/admin`
- **Cities Table** (lines 268-339): Editable columns: Node Name, Date/Version, Status, Delete
  - `addCity()` (line 136): adds `{ name: '', status: 'Planned', date: 'Expansion' }`
  - `updateCity()` (line 140): updates local state, saves via `/api/admin/cities` POST
  - **To add a column:** Add `<th>` in thead → Add `<td>` with input/select in tbody → Update `addCity()` default object → Update Apps Script `handleUpdateCities` → Add column to Google Sheets headers
- **Dashboard** (lines 237-266): Shows `DashCard` components for Vendors, Attendees, Venues, Referrers, Staff, Sponsors, Promoters, Pending Payouts
  - Events data comes from `handleGetDash` → `dash.events` array
  - Currently **read-only** — no event CRUD UI exists

---

### API Routes

#### `api/cities.js` (Public GET)
- Rate limited: 30 req/min
- Calls Apps Script with `action: 'getCities'`
- Sanitizes: `name` (100), `status` (50), `date` (50)
- Returns max 50 cities
- No auth required

#### `api/admin/cities.js` (Admin POST)
- Requires auth token (cookie or Bearer)
- Sends `action: 'updateCities'` with cities array to Apps Script
- Sanitizes input before sending

#### `api/admin/dashboard.js` (Admin GET)
- Requires auth token
- Calls Apps Script with `action: 'getDash'`
- Returns aggregated metrics including `events` array

#### `api/submit.js` (Public POST — handles CityRequest)
- Rate limited: 5 req/15min per IP
- Validates and sanitizes all inputs
- Forwards to Apps Script with `action: 'submit'`, `type: 'CityRequest'`, `_secret: INTERNAL_WEBHOOK_SECRET`
- Data stored in Google Sheets **Contacts** tab (not Cities tab)

---

### Apps Script Handlers (in `infrastructure/backend_apps_script.js`)

#### `handleGetCities` (lines 598-618)
- Reads Cities sheet
- Maps columns via `getColMap` (dynamic, by header name)
- Returns: `[{ name, status, date }, ...]`

#### `handleUpdateCities` (lines 621-641)
- Clears sheet, writes headers, writes all cities
- Expects: `{ cities: [{ name, status, date }, ...] }`
- Adds `LastUpdated` timestamp automatically

#### `handleGetDash` (lines 976-1090)
- Reads all sheets (Vendors, Attendees, Venues, Referrals, Promoters, Staff, Sponsors, **Events**)
- **Events**: reads Events sheet, returns array of `{ name, city, venue, date, capacity, status }`
- Returns aggregated dashboard object

#### `handleCronCapacityCheck` (lines 1096-1158)
- Runs hourly via trigger
- Checks Events sheet for 70% capacity threshold
- Notifies waitlisted vendors via email when threshold reached
- Updates `NotifiedAt`, `SoldCount`, `Status` on Events sheet

---

### Safe Editing Patterns

#### Adding a New City (User: "Add Tokyo")
1. **Admin**: Open `/admin` → Edit table → Click "Commit Changes"
2. **Or**: Edit directly in Google Sheets (Cities tab)

#### Changing a City Name (User: "Rename NYC to New York City")
1. Open `/admin` → Edit name in table → "Commit Changes"
2. Or edit directly in Google Sheets (Cities tab)

#### Adding a New City Property (e.g., "Venue", "Capacity")
**Requires coordinated changes across 4 layers:**
1. **Google Sheets**: Add column header to Cities tab
2. **Apps Script `handleGetCities`**: Add to returned object (lines 611-615)
3. **Apps Script `handleUpdateCities`**: Accept in input, write to sheet (lines 631-637)
4. **API sanitization**: Update `api/cities.js` and `api/admin/cities.js` field limits
5. **Frontend**: Update `CityNode` and Admin table to display/edit new field

#### Adding/Editing Events
**Currently only via Google Sheets (Events tab):**
1. Open Google Sheets → Events tab
2. Add/edit rows with: EventName, City, Venue, EventDate, Capacity, Status
3. Run `setupTriggers` in Apps Script if first time
4. Dashboard (`/admin`) will reflect changes on next load

#### Changing Status Options (Cities)
1. **Google Sheets**: Update data validation on Status column
2. **Apps Script `SHEET_DEFS`** (line 103-106): Update `statuses` array
3. **Admin.jsx** (lines 306-315): Update `<select>` options to match

#### Changing Status Options (Events)
1. **Google Sheets**: Update data validation on Status column
2. **Apps Script `SHEET_DEFS`** (line 152-155): Update `statuses` array
3. **No frontend select exists yet** — would need to be added if event CRUD UI is built

---

### Common Mistakes to Avoid

| Mistake | Why It Breaks | Correct Approach |
|---------|---------------|------------------|
| Editing city data in `Cities.jsx` state | Overwritten on next fetch | Data source is Google Sheets only |
| Adding fields to API without Apps Script | Silent data loss | Update all 4 layers together |
| Hardcoding status values in frontend | Mismatch with sheet validation | Use dynamic values or keep in sync |
| Forgetting `LastUpdated` in Apps Script | Audit trail broken | Apps Script adds it automatically |
| Editing events in frontend | No event API exists | Edit Google Sheets Events tab directly |
| Adding event CRUD without API | No endpoint to save | Build `/api/admin/events` first |

---

### When User Says "Change Location" or "Change Event"

**Location requests:**
1. "Add a city" → Use Admin panel (`/admin`) or Google Sheets (Cities tab)
2. "Rename a city" → Edit in Admin panel or Google Sheets
3. "Change city status" → Edit Status dropdown in Admin panel
4. "Change city date" → Edit Date field in Admin panel
5. "Add a new property to cities" → Requires full 4-layer update (see above)

**Event requests:**
1. "Add an event" → Edit Google Sheets (Events tab) directly
2. "Change event date/venue/city" → Edit Google Sheets (Events tab)
3. "Change event status" → Edit Status in Google Sheets (Events tab)
4. "Change event capacity" → Edit Capacity in Google Sheets (Events tab)
5. "Build event management UI" → Requires: new API routes + Apps Script handlers + Admin panel CRUD table

**Never** edit `src/pages/Cities.jsx` to add fake city data. The component is a *display layer only*.

---

### Verification Checklist After Changes

**Cities:**
- [ ] Admin panel loads cities correctly
- [ ] Public `/cities` page shows updated data
- [ ] New city appears with correct status/date
- [ ] No console errors on either page
- [ ] Google Sheets (Cities tab) reflects the changes

**Events:**
- [ ] Admin dashboard shows updated events in DashCards
- [ ] Google Sheets (Events tab) reflects the changes
- [ ] Cron capacity check runs without errors (check Apps Script logs)

---

### Emergency Rollback

**If Admin panel breaks:**
1. Go directly to Google Sheets (Cities tab)
2. Fix data manually
3. Refresh `/cities` page — it reads from Sheets via API

**If Events break:**
1. Go directly to Google Sheets (Events tab)
2. Fix data manually
3. Refresh `/admin` — dashboard reads from Sheets via `getDash`

---

### Related Files Quick Reference

```
/Users/lakshitsinghvi/Documents/Repos/Marketpeace-FA-download/
├── src/pages/Cities.jsx              # Public city display + request form
├── src/pages/Admin.jsx               # Admin city editor + dashboard
├── api/cities.js                     # Public cities API
├── api/admin/cities.js               # Admin cities CRUD API
├── api/admin/dashboard.js            # Admin dashboard API (includes events)
├── infrastructure/backend_apps_script.js  # Apps Script handlers
├── Google Sheets (Cities tab)        # Source of truth for locations
└── Google Sheets (Events tab)        # Source of truth for events
```

---

### Quick Commands for Testing

```bash
# Test public cities API
curl https://your-domain/api/cities

# Test admin cities API (requires auth)
curl -X POST https://your-domain/api/admin/cities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cities":[{"name":"Test City","status":"Planned","date":"Q1 2026"}]}'

# Test admin dashboard API (includes events)
curl -H "Authorization: Bearer <token>" \
  https://your-domain/api/admin/dashboard
```

---

## Usage Instructions for AI Agent

1. **First**: Execute PART 1 (Deployment Prompt) to get the project deployed
2. **Then**: Use PART 2 (Skill) whenever user asks to:
   - Add/rename/delete cities
   - Change city status/date
   - Add new city fields
   - Add/edit/delete events
   - Change event details
   - Build event management UI (requires new API + frontend work)

The skill contains all file paths, line numbers, and data flow mappings needed to make changes safely without breaking the pipeline.
# MARKETPEACE — Complete Site Manifest

## Brand Identity
- **Name**: MARKETPEACE (stylized all-caps)
- **Tagline**: "The Infrastructure of Independence"
- **Punchline**: "We found peace, by having a piece of the market."
- **Domain**: `marketpeace.isira.club`
- **Business**: Vendor-event marketplace connecting small businesses, venues, and communities
- **Contact Email**: `foreignaffairsllc2017@gmail.com`
- **Instagram**: `@foreignaffairsmarket`
- **Owner**: Foreign Affairs LLC

## Palette (Arctic Depths)
| Role | Hex | Usage |
|------|-----|-------|
| Primary Accent | `#0DB8D3` | Buttons, badges, borders, icons, glows, links |
| Secondary Accent | `#1B7FDC` | Highlight text, hover states, event dates |
| Tertiary | `#065B98` | Deep blue, subtle elements |
| Background | `#193546` | Dark navy body/video overlay |
| Background overlay | `#193546/40` | 40% dark overlay on background video |

## Global Components

### BackgroundCanvas (`z-0`)
- **Poster image**: `/background.jpg` (27KB) — shown while video loads
- **Background video**: `/background.mp4` (1.2MB) — muted, loop, autoPlay, `object-cover`
- **Dark overlay**: `bg-[#193546]/40` for text readability
- Crossfade transition between poster → video

### LoadingScreen (`z-[1000]`)
- **Intro video**: `/video.mp4` (3.8MB) — fullscreen, muted, autoPlay
- **Skip prompt**: "Tap anywhere to skip" — bottom center, low opacity, pulsing
- **Behavior**: Plays once per session (sessionStorage), auto-dismisses on video end, click-to-dismiss
- **Exit animation**: Opacity fade 0.8s

### Navbar (`z-[50]`)
- **Desktop links**: Home (`/`), Markets (`/cities`), Vendors (`/vendors`), Community (`/attendees`)
- **Desktop CTA**: "Join Now" (`/vendors`)
- **Mobile**: Hamburger toggle, same links + CTA
- **Behavior**: Background appears on scroll >60px
- **Icons**: Menu, X (lucide-react)

### Footer
- **Logo**: MARKETPEACE heading
- **Tagline**: "The Local Marketplace for Everyone"
- **Social**: Instagram, Twitter, Email (links)
- **Nav**: Vendors, Tickets, Cities, Venues, Privacy, Terms, Contact, Legal
- **Copyright**: "© 2026 MARKETPEACE. ALL RIGHTS RESERVED. | SUPPORT LOCAL."

---

## Pages

### 1. Home (`/`)
**Hero Section**
- Animated MARKETPEACE letter images (11 letters: M-A-R-K-E-T-P-E-A-C-E)
- Tagline: "The Infrastructure of Independence"
- Quote: `"We found peace, by having a piece of the market."`
- Description: "The vendor-event marketplace connecting small businesses, cool venues, and the communities that love them."
- **Buttons**: "Apply as Vendor" (`/vendors`), "Partner Your Venue" (`/venues`), "Sign Up as Vendor" (`/vendors`), "Register as Attendee" (`/attendees`)
- **Pricing bar**: $250 Standard, $500 Flagship, $5 Door Entry

**About Section**
- "About Marketpeace"
- "Who can be a vendor? Anyone can be a vendor."
- 4 PillarCards: Vendors, Venues, Attendees, Partners

**How it Works**
- 3 JourneySteps: Apply → Selected → Promoted
- "Bonus: Profit & Repeat."

**Vendor Application**
- "Limited Slots Remaining" badge
- "Your booth. Your crowd. Your commission."
- Standard tier card ($250), Flagship tier card ($500) — both link to `/vendors`
- Benefits: Marketing Support, Data Ownership, Pro Photography
- "Secure Your Piece" card → "SECURE YOUR SPOT" button (`/vendors`)

**Referral Network**
- 5 RewardTiers: $50–$300 for referrals
- "Join the Network" (`/contact`)

**Upcoming Events**
- From venueNodes data, shows Approved/Active venues with dates
- Cards link to `/venues`

**Cities Ticker**
- Auto-scrolling marquee of cityNodes
- "VIEW ALL CITIES" (`/cities`)

**CTA**
- "Ready to Join?" → "Go to Contact Page" (`/contact`)

**FAQ**
- 6 FAQItems covering: vendor application, pricing, attending, venue partnership, referrals, approval timeline

**State**: `cityNodes` (from `/api/cities`), `venueNodes` (from `/api/venues`)

---

### 2. Vendors (`/vendors`) — "Vendor Applications"
- **Heading**: "Grow Your Business Here"
- **Description**: "Join MARKETPEACE and get your brand in front of thousands of local shoppers..."
- **Tier selection**: Standard ($250) / Flagship ($500) — buttons select tier
- **Tier details**: Booth size, placement, promotion level
- **12 benefits listed**: Foot traffic, listing, social features, promoter system, photo/video, early access, directory, email blasts, analytics, recurring discount, QR signage, cashless payments
- **Form fields**: Full Name, Brand Name, Email, Instagram
- **Checkbox**: Terms agreement (non-refundable deposit)
- **Submit**: "PAY $250" / "PAY $500" → `fetchCheckoutSession` + `submitForm`
- **State**: `formData { name, businessName, email, instagram, tier }`, `status { submitting, success, error }`

---

### 3. Attendees (`/attendees`) — "Get Tickets"
- **Heading**: "Shop Local. Discover New."
- **3 Features**: Curated Vendors, VIP Perks, Live Entertainment
- **Form fields**: Full Name, Email
- **Ticket select**: Standard Access ($5) / Free (Share on Social) / Free (Bring 2 Friends)
- **Submit**: "PAY $5 ACCESS" or "GET FREE ACCESS" → `fetchCheckoutSession` + `submitForm`
- **CTA**: "VIEW EVENT SCHEDULE" (`/cities`)
- **State**: `formData { name, email, ticketType }`, `status { submitting, success, error }`

---

### 4. Venues (`/venues`) — "Venue Partnerships"
- **Heading**: "Host an Event, Get Filled"
- **4 Features**: New Foot Traffic (150-300+ patrons), Professional Content, Recurring Revenue, Full Insurance ($1M)
- **Form fields**: Venue Name, Contact Name, Email, Location, Notes
- **Submit**: "REQUEST PARTNERSHIP" → `submitForm`
- **Venue listing**: Polled from `/api/venues` every 30s
- **Venue cards**: venueName, status, location, event date, capacity
- **Venue modal**: All 16 fields (Venue Name, Status, Location, Event Date, Capacity, Parking, WiFi, Type, Contact, Email, Phone, Notes, Contract, Last Updated)
- **State**: `formData`, `formStatus`, `venues[]`, `loading`, `selectedVenue`

---

### 5. Cities (`/cities`) — "Coming Soon"
- **Heading**: "Find a Market Near You"
- **Description**: "MARKETPEACE is expanding to a city near you..."
- **City cards**: name, date, status (from `/api/cities`)
- **CTA**: "REQUEST YOUR CITY" (`/contact`)
- **State**: `cityNodes[]`, `loading`

---

### 6. Contact (`/contact`) — "Get In Touch"
- **Contact methods**: Email (`foreignaffairsllc2017@gmail.com`), Instagram (`@foreignaffairsmarket`)
- **Vendor section**: "FOR VENDORS" — Direct curation email
- **Form fields**: Full Name, Email Address, Subject (General/Vendor/Venue/Promoter), Message
- **Submit**: "SEND MESSAGE" → `submitForm` → `/api/submit`
- **State**: `formData { name, email, subject, message }`, `status { submitting, success, error }`

---

### 7. Legal (`/legal`)
- **Heading**: "Transparency & Security"
- **3 Cards**: Privacy Policy ("Read Policy →" `/privacy`), Terms of Service ("Read Terms →" `/terms`), Vendor Agreement ("REQUEST AGREEMENT" mailto)
- **Mentions**: $1M liability insurance, deposit structure, data handling

---

### 8. Privacy (`/privacy`)
- 5 sections: Information We Collect, How We Use Your Info, Information Sharing, Content and Media, Your Choices
- **Contact**: foreignaffairsllc2017@gmail.com for removal requests
- **Back link**: "Back to Legal" (`/legal`)

---

### 9. Terms (`/terms`)
- 6 sections: Vendor Participation & Fees ($150 total, $75 deposit), Payments (Stripe), Refund Policy (non-refundable), Booth Space (10'x10' or 5'x10'), Liability ($1M insurance), Code of Conduct
- **Back link**: "Back to Legal" (`/legal`)

---

### 10. Admin (`/admin`)
- **Login**: ID + Password → POST `/api/admin/login`
- **Dashboard**: "System Editor" — CRUD for cities
- **Table**: Node Name (input), Date/Version (input), Status (select: Active/Planned/Completed/Cancelled)
- **Actions**: Add row (+), Delete row (trash), Commit Changes (save), Exit (logout)
- **API**: GET `/api/admin/cities`, POST `/api/admin/cities`, POST `/api/admin/logout`
- **State**: `isLoggedIn`, `token`, `id`, `password`, `cities[]`, `loading`, `error`, `success`

---

### 11. Success (`/success`)
- **Heading**: "Payment Confirmed"
- **Text**: "Your {type} is now synchronized. A confirmation has been sent to your email."
- **Shows**: Transaction ID
- **Button**: "RETURN TO HOME →" (`/`)
- **Validation**: Whitelisted types: Vendor, Attendee, Venue

---

## API Endpoints
| Path | Method | Purpose |
|------|--------|---------|
| `/api/cities` | GET | Fetch all cities |
| `/api/venues` | GET | Fetch all venues |
| `/api/venues/sync` | POST | Webhook for sheet→site venue sync |
| `/api/submit` | POST | Proxy form submission to Google Apps Script |
| `/api/stripe-checkout` | POST | Create Stripe checkout session |
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/cities` | GET | Admin fetch cities |
| `/api/admin/cities` | POST | Admin update/create cities |

## Infrastructure (Apps Script)
- **URL**: `https://script.google.com/macros/s/AKfycbwlUtPjviiBU6j2Q7Yrw-daZxs3hofX-slis-x-ZG0Uvcq_CuC0rCdqQaBFAgSJ9U9N4Q/exec`
- **Sheet ID**: `1U4OAHwkntuIlcgWUbtAFJ2R0hBkyTqSJHtmmzsjEa1g`
- **Auth**: `_secret` in POST body
- **Triggers**: autoSync (5min), dailyReport (daily), onEdit (venues)
- **Discord**: Webhook for new registrations + daily reports
- **Email**: foreignaffairsllc2017@gmail.com (daily reports)

## Assets
| File | Size | Purpose |
|------|------|---------|
| `/video.mp4` | 3.8MB | Intro loading animation |
| `/background.mp4` | 1.2MB | Looping background video |
| `/background.jpg` | 27KB | Poster image for background |
| `/assets/logo.png` | — | Logo |
| `/assets/footer-market.png` | — | Footer graphic |
| `/assets/letters/*.png` | 11 files | MARKETPEACE letter animations |

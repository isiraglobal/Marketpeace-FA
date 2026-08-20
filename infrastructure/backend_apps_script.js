/**
 * MARKETPEACE — Google Apps Script Form Backend & AI Cron Engine
 *
 * Dedicated strictly to Form Submissions & AI Cron Automation.
 *
 * ─── ACTIVE FORM SHEETS ONLY ───
 * 1. Vendors     (Free vendor profile + High-ticket booth requests)
 * 2. Attendees   (Community ticket RSVPs & Attendee signups)
 * 3. Venues      (Venue host & partnership applications)
 * 4. Contacts    (Contact messages, Referral Network signups, Booth inquiries, City requests)
 * 5. Visitors    (Master Lead List: Popup leads, Newsletter subscribers & ALL incoming leads)
 * 6. Cities      (Expansion nodes readable by the public site + edited by admin)
 * 7. Referrers   (Referral network codes, payout method, lifetime totals)
 * 8. Referrals   (Tracked referral events, rewards, payout status)
 * 9. Promoters   (Street/promoter tiers S/A/B/C with commission rates)
 * 10. Staff      (Event crew applications)
 * 11. Sponsors   (Sponsor decks & partnerships)
 * 12. Agreements (Signed vendor e-sign consents)
 * 13. Events     (Event lineup, capacity, 70% finalization state)
 *
 * ─── ACTIONS ───
 *   submit            → write any form type (+ lead sync + email + Discord)
 *   updateStatus      → mark Vendor/Attendee Paid/Confirmed from Stripe webhook
 *   getVenues         → public site venue directory (POST)
 *   getCities         → public site expansion nodes (POST or GET ?action=getCities)
 *   updateCities      → admin city node editor (POST, auth via Vercel)
 *   cronProcessAIOffers  → AI offer generation + email + payment link (every ~10m)
 *   cronProcessFollowUps → nudge unpaid vendors with outstanding offers (every 6h)
 *   cronCapacityCheck    → 70% capacity finalization + 48h balance window (hourly)
 *   registerReferrer  → mint MP-XXXX-XXX referral code + welcome email
 *   lookupReferrer    → validate a code at form time (rate-limited via Vercel)
 *   listReferrals     → admin referral ledger (auth via Vercel)
 *   payoutReferrals   → bi-weekly payout run, marks paid + milestone bonuses
 *   getDash           → admin revenue/ops dashboard (auth via Vercel)
 *
 * ─── ONE-TIME SETUP ───
 * 1. Extensions → Apps Script, replace Code.gs with this file, save.
 * 2. In the function dropdown, select `setupSheets` and click Run (creates & formats all form sheets + Cities).
 * 3. Project Settings (gear icon) → Script Properties → Add:
 *    - DISCORD_WEBHOOK_URL: Your Discord Webhook URL (optional)
 *    - INTERNAL_SECRET: Ngl6yoAFUTTbXp3OdPvPUPaFzPlbsIR0HgXNv2AWHsE=
 *    - NVIDIA_NIM_API_KEY: Your NVIDIA NIM API key for AI offers (optional, has built-in smart fallback)
 *    - STRIPE_SECRET_KEY: Your Stripe secret key (optional, for payment links)
 * 4. Deploy → New Deployment → Web app → Execute as: Me → Who has access: Anyone
 * 5. In the function dropdown, select `setupTriggers` and click Run once.
 *    This creates BOTH cron triggers automatically (10-minute AI offers + 6-hour follow-ups).
 *    Or add them manually via the clock icon as before.
 */

const SHEET_ID = '1O2cJqGK2qNAHA9mw2vC4szRtfLshfL0jjmrQicEok6I';
const PROPS = PropertiesService.getScriptProperties();
const DISCORD_WEBHOOK_URL = PROPS.getProperty('DISCORD_WEBHOOK_URL');
const INTERNAL_SECRET = PROPS.getProperty('INTERNAL_SECRET');
const NVIDIA_NIM_API_KEY = PROPS.getProperty('NVIDIA_NIM_API_KEY');
const STRIPE_SECRET_KEY = PROPS.getProperty('STRIPE_SECRET_KEY');

/* ═══════════════════════════════════════════
   5 CORE FORM SHEET DEFINITIONS ONLY
   ═══════════════════════════════════════════ */
const SHEET_DEFS = [
  {
    name: 'Vendors',
    headers: [
      'Timestamp', 'TransactionID', 'Status', 'Name', 'BusinessName', 'Email', 'Phone', 'Instagram',
      'Category', 'ProfileType', 'Website', 'Tier', 'Amount', 'PaymentMethod', 'StripeSessionID',
      'ReceiptURL', 'Notes', 'LastUpdated', 'OfferAmount', 'OfferSubject', 'OfferBody',
      'PaymentLinkURL', 'OfferSentAt', 'OfferStatus', 'FollowUpAt', 'FollowUpCount', 'Event'
    ],
    statuses: ['Free Profile', 'Pending', 'Deposit Pending', 'Offer Sent', 'Offer Follow-Up', 'Deposit Paid', 'Paid', 'Confirmed', 'Waiting List', 'Cancelled', 'Refunded'],
    color: '#0DB8D3',
    widths: [180, 140, 120, 160, 200, 200, 140, 160, 160, 120, 200, 100, 80, 120, 200, 200, 300, 180, 100, 250, 320, 220, 180, 120, 180, 120, 160],
  },
  {
    name: 'Attendees',
    headers: ['Timestamp', 'TransactionID', 'Status', 'Name', 'Email', 'Phone', 'TicketType', 'Amount', 'Referrer', 'Notes', 'LastUpdated'],
    statuses: ['Pending', 'Paid', 'Confirmed', 'Checked In', 'Cancelled', 'Refunded'],
    color: '#00a86b',
    widths: [180, 140, 100, 160, 200, 140, 120, 80, 160, 300, 180],
  },
  {
    name: 'Venues',
    headers: ['Timestamp', 'Status', 'VenueName', 'ContactName', 'Email', 'Phone', 'Location', 'City', 'Capacity', 'HasParking', 'HasWiFi', 'IndoorOutdoor', 'Notes', 'EventDate', 'LastUpdated'],
    statuses: ['In Review', 'Approved', 'Active', 'Completed', 'Declined'],
    color: '#9b59b6',
    widths: [180, 100, 200, 160, 200, 140, 200, 140, 80, 80, 80, 100, 300, 140, 180],
  },
  {
    name: 'Contacts',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Source', 'Replied', 'Notes', 'LastUpdated'],
    statuses: ['New', 'Read', 'Replied', 'Archived'],
    color: '#e67e22',
    widths: [180, 160, 200, 140, 200, 400, 120, 80, 300, 180],
  },
  {
    name: 'Visitors',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Source', 'Details', 'Status', 'LastUpdated'],
    statuses: ['Subscribed', 'Lead', 'Vendor Lead', 'Attendee Lead', 'Venue Lead', 'Unsubscribed'],
    color: '#1B7FDC',
    widths: [180, 160, 220, 140, 150, 250, 120, 180],
  },
  {
    name: 'Cities',
    headers: ['Name', 'Status', 'Date', 'LastUpdated'],
    statuses: ['Active', 'Planned', 'Completed', 'Cancelled'],
    color: '#1B7FDC',
    widths: [220, 120, 160, 180],
  },
  {
    name: 'Referrers',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'ReferrerCode', 'Platform', 'PayoutMethod', 'Type', 'Status', 'TotalReferrals', 'TotalCash', 'TotalCredit', 'LastUpdated'],
    statuses: ['Active', 'Suspended'],
    color: '#0DB8D3',
    widths: [180, 160, 220, 140, 150, 120, 120, 110, 100, 110, 100, 100, 180],
  },
  {
    name: 'Referrals',
    headers: ['Timestamp', 'ReferrerCode', 'ReferrerName', 'ReferrerEmail', 'ReferredType', 'ReferredName', 'ReferredBusiness', 'ReferredTID', 'Status', 'CashReward', 'CreditReward', 'PayoutStatus', 'PayoutMethod', 'PayoutDate', 'VerifiedAt', 'LastUpdated'],
    statuses: ['Pending', 'Verified', 'Deposit Paid', 'Disputed', 'Fraud'],
    color: '#16a34a',
    widths: [180, 140, 160, 220, 120, 160, 200, 160, 130, 100, 100, 120, 120, 140, 160, 180],
  },
  {
    name: 'Promoters',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Instagram', 'Tier', 'Commission', 'PayoutMethod', 'Status', 'Notes', 'LastUpdated'],
    statuses: ['Active', 'Pending', 'Suspended'],
    color: '#e67e22',
    widths: [180, 160, 220, 140, 160, 80, 100, 120, 100, 300, 180],
  },
  {
    name: 'Staff',
    headers: ['Timestamp', 'TransactionID', 'Status', 'Name', 'Email', 'Phone', 'Role', 'Availability', 'Experience', 'Location', 'Notes', 'LastUpdated'],
    statuses: ['New', 'Screened', 'Hired', 'Onboarded', 'Declined', 'Archived'],
    color: '#1B7FDC',
    widths: [180, 140, 100, 160, 220, 140, 180, 140, 160, 140, 300, 180],
  },
  {
    name: 'Sponsors',
    headers: ['Timestamp', 'Status', 'Company', 'ContactName', 'Email', 'Phone', 'Tier', 'Budget', 'Website', 'Notes', 'LastUpdated'],
    statuses: ['New', 'Contacted', 'Proposal Sent', 'Closed', 'Declined'],
    color: '#9b59b6',
    widths: [180, 100, 200, 160, 220, 140, 120, 100, 200, 300, 180],
  },
  {
    name: 'Agreements',
    headers: ['Timestamp', 'TransactionID', 'Type', 'Name', 'Email', 'BusinessName', 'SignedAt', 'Signature', 'AgreementVersion', 'LastUpdated'],
    statuses: ['Signed', 'Awaiting', 'Expired'],
    color: '#00a86b',
    widths: [180, 140, 120, 160, 220, 200, 180, 160, 140, 180],
  },
  {
    name: 'Events',
    headers: ['Timestamp', 'EventName', 'City', 'Venue', 'EventDate', 'Capacity', 'SoldCount', 'NotifiedAt', 'BalanceDueAt', 'Status', 'LastUpdated'],
    statuses: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
    color: '#0DB8D3',
    widths: [180, 220, 140, 220, 140, 100, 100, 180, 180, 100, 180],
  },
];

/* ═══════════════════════════════════════════
   SETUP & SPREADSHEET ACCESS
   ═══════════════════════════════════════════ */

function getSS() {
  try {
    if (SHEET_ID && SHEET_ID.trim() !== '') {
      return SpreadsheetApp.openById(SHEET_ID.trim());
    }
  } catch (e) {
    Logger.log('openById failed, using getActiveSpreadsheet: ' + e.toString());
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Spreadsheet not accessible. Verify SHEET_ID.');
}

function setupSheets() {
  const ss = getSS();

  // Create & format only the 5 required form sheets
  SHEET_DEFS.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    sheet.setFrozenRows(1);

    const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setValues([def.headers]);
    headerRange.setBackground(def.color);
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);

    if (def.widths) {
      def.widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
    }

    if (def.statuses && def.statuses.length > 0) {
      const statusCol = def.headers.indexOf('Status') + 1;
      if (statusCol > 0) {
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(def.statuses, true)
          .setAllowInvalid(false)
          .build();
        const lastRow = Math.max(sheet.getMaxRows(), 100);
        sheet.getRange(2, statusCol, lastRow - 1).setDataValidation(rule);
      }
    }
    Logger.log(`✅ Form sheet ready: ${def.name}`);
  });

  // Remove unused/legacy non-form sheets if present
  const UNUSED_SHEETS = ['Analytics', 'Transactions', 'Newsletter', 'CityRequests', 'Sheet1'];
  UNUSED_SHEETS.forEach(oldName => {
    const s = ss.getSheetByName(oldName);
    if (s && ss.getSheets().length > 1) {
      try {
        ss.deleteSheet(s);
        Logger.log(`🗑️ Removed unused sheet: ${oldName}`);
      } catch (err) {
        Logger.log(`Could not remove ${oldName}: ${err.toString()}`);
      }
    }
  });

  const firstSheet = ss.getSheetByName('Vendors');
  if (firstSheet) ss.setActiveSheet(firstSheet);
  SpreadsheetApp.flush();
  Logger.log('🎉 Setup complete! All form sheets are configured.');
}

/* ═══════════════════════════════════════════
   HELPERS & DYNAMIC COLUMN MAPPING
   ═══════════════════════════════════════════ */

function sanitize(val, max) {
  if (typeof val !== 'string') val = String(val || '');
  return val.trim().replace(/^[=+\-@]/, "'$&").slice(0, max || 500);
}

function nowISO() {
  return new Date().toISOString();
}

function ensureSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  const def = SHEET_DEFS.find(d => d.name === name);
  sheet = ss.insertSheet(name);
  sheet.setFrozenRows(1);
  if (def) {
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers])
      .setBackground(def.color).setFontColor('#ffffff').setFontWeight('bold');
    if (def.widths) def.widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }
  return sheet;
}

function getColMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h) map[String(h).trim()] = i + 1;
  });
  return map;
}

function findRowByTID(sheet, tid) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(tid)) return i + 1;
  }
  return -1;
}

function isAuthorized(data) {
  if (!INTERNAL_SECRET) return true; // Permissive if not yet set in Script Properties
  if (data && data._secret === INTERNAL_SECRET) return true;
  return false;
}

/* ═══════════════════════════════════════════
   MASTER VISITOR & AUDIENCE SYNC
   ═══════════════════════════════════════════ */

/**
 * Stores all leads and newsletter subscribers in `Visitors` master sheet.
 * Enables sending newsletters, offers, and marketing campaigns to everyone.
 */
function syncLeadToVisitors(ss, data) {
  if (!data || !data.email) return;
  const email = sanitize(data.email, 254).toLowerCase();
  if (!email || !email.includes('@')) return;

  const sheet = ensureSheet(ss, 'Visitors');
  const rows = sheet.getDataRange().getValues();
  const name = sanitize(data.name || data.contactName || 'Subscriber', 100);
  const phone = sanitize(data.phone || '', 30);
  const source = sanitize(data.type || data.source || 'Website', 50);
  const details = sanitize(data.businessName || data.venueName || data.city || data.subject || data.page || data.category || '', 200);
  const isNewsletter = source.toLowerCase().includes('newsletter');
  const status = isNewsletter ? 'Subscribed' : 'Lead';
  const ts = nowISO();

  // Check if email already exists in Visitors
  let existingRow = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = String(rows[i][2] || '').trim().toLowerCase(); // Email is Col 3
    if (rowEmail === email) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow > 0) {
    // Update existing visitor record with latest details and timestamp
    const colMap = getColMap(sheet);
    if (colMap['Name'] && name !== 'Subscriber') sheet.getRange(existingRow, colMap['Name']).setValue(name);
    if (colMap['Phone'] && phone) sheet.getRange(existingRow, colMap['Phone']).setValue(phone);
    if (colMap['Source']) sheet.getRange(existingRow, colMap['Source']).setValue(source);
    if (colMap['Details']) sheet.getRange(existingRow, colMap['Details']).setValue(details);
    if (colMap['Status'] && isNewsletter) sheet.getRange(existingRow, colMap['Status']).setValue('Subscribed');
    if (colMap['LastUpdated']) sheet.getRange(existingRow, colMap['LastUpdated']).setValue(ts);
  } else {
    // Append new visitor row
    sheet.appendRow([ts, name, email, phone, source, details, status, ts]);
  }
  SpreadsheetApp.flush();
}

/* ═══════════════════════════════════════════
   WEBHOOK HANDLERS (doPost & doGet)
   ═══════════════════════════════════════════ */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respond({ error: 'No post data' });
    }
    const data = JSON.parse(e.postData.contents);
    if (!data.action) return respond({ error: 'Missing action' });

    if (!isAuthorized(data)) {
      notifyDiscord('🚨 Unauthorized Webhook Call', `Action: ${data.action}`, 15158332);
      return respond({ error: 'Unauthorized' });
    }

    const ss = getSS();

    switch (data.action) {
      case 'submit':
        return handleSubmit(ss, data);

      case 'updateStatus':
        return handleUpdateStatus(ss, data);

      case 'cronProcessAIOffers':
      case 'processPendingOffers':
        return handleCronProcessAIOffers(ss);

      case 'cronProcessFollowUps':
        return handleCronProcessFollowUps(ss);

      case 'getVenues':
        return handleGetVenues(ss);

      case 'getCities':
        return handleGetCities(ss);

      case 'updateCities':
        return handleUpdateCities(ss, data);

      case 'health':
        return respond({ status: 'ok', timestamp: nowISO(), sheet: SHEET_ID, sheets: ss.getSheets().map(s => s.getName()) });

      case 'registerReferrer':
        return handleRegisterReferrer(ss, data);

      case 'lookupReferrer':
        return handleLookupReferrer(ss, data);

      case 'listReferrals':
        return handleListReferrals(ss);

      case 'payoutReferrals':
        return handlePayoutReferrals(ss, data);

      case 'getDash':
        return handleGetDash(ss);

      case 'cronCapacityCheck':
        return handleCronCapacityCheck(ss);

case 'STAFF':
      return [
        ts,
        tid,
        s(data.status || 'New', 50),
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.role || 'General Crew', 150),
        s(data.availability, 200),
        s(data.experience, 300),
        s(data.location, 100),
        s(data.notes, 1000),
        ts
      ];

    case 'SPONSOR':
      return [
        ts,
        s(data.status || 'New', 50),
        s(data.company || data.businessName, 150),
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.tier || 'Supporting', 100),
        s(data.budget, 100),
        s(data.website, 200),
        s(data.notes, 1000),
        ts
      ];

    case 'PROMOTER':
      const promoterTier = String(data.tier || 'B').toUpperCase();
      const CommissionRate = { S: '20%', A: '15%', B: '10%', C: '5%' }[promoterTier] || '10%';
      return [
        ts,
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.instagram, 100),
        promoterTier,
        CommissionRate,
        s(data.payoutMethod || 'paypal', 30),
        s(data.status || 'Pending', 30),
        s(data.notes, 500),
        ts
      ];

    case 'VENDORAGREEMENT':
      return [
        ts,
        tid,
        'Signed',
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.businessName, 150),
        nowISO(),
        s(data.signature || data.name, 120),
        s(data.version || '1.0', 30),
        ts
      ];

    default:
        return respond({ error: 'Unknown action: ' + data.action });
    }
  } catch (err) {
    console.error('doPost error:', err.toString());
    notifyDiscord('⚠️ System Error', sanitize(err.toString(), 300), 15158332);
    return respond({ error: 'Internal error: ' + err.toString() });
  }
}

function doGet(e) {
  try {
    const ss = getSS();
    const action = (e && e.parameter && e.parameter.action) || 'health';
    if (action === 'health') {
      return respond({ status: 'ok', timestamp: nowISO(), sheet: SHEET_ID, sheets: ss.getSheets().map(s => s.getName()) });
    }
    if (action === 'getCities') {
      return handleGetCities(ss);
    }
    return respond({ error: 'Unknown action' });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/* ─── Action: submit ─── */
function handleSubmit(ss, data) {
  const typeUpper = (data.type || '').toUpperCase();
  const map = {
    VENDOR: 'Vendors',
    ATTENDEE: 'Attendees',
    VENUE: 'Venues',
    CONTACT: 'Contacts',
    VISITOR: 'Visitors',
    CITYREQUEST: 'Contacts', // Store CityRequests in Contacts tab
    NEWSLETTER: 'Visitors',  // Store Newsletters directly in Visitors tab
    STAFF: 'Staff',
    SPONSOR: 'Sponsors',
    PROMOTER: 'Promoters',
    VENDORAGREEMENT: 'Agreements', // Signed vendor agreement consent
  };

  const sheetName = map[typeUpper];
  if (!sheetName) return respond({ error: 'Invalid type: ' + data.type });

  const sheet = ensureSheet(ss, sheetName);
  const tid = sanitize(data.transactionID || 'TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase(), 50);

  // Build row and append to specific form sheet
  const row = buildRow(typeUpper, data, tid);
  sheet.appendRow(row);
  SpreadsheetApp.flush(); // Guaranteed instant write to sheet!

  // ─── REFERRAL TRACKING (auto-record when a valid referrer code is supplied) ───
  const refCode = sanitize(data.referrer || '', 50).trim();
  if (refCode && /^MP[-_][A-Z0-9]{2,4}/i.test(refCode)) {
    recordReferralIfValid(ss, {
      code: refCode,
      referredType: typeUpper,
      referredName: sanitize(data.name || '', 100),
      referredBusiness: sanitize(data.businessName || data.venueName || '', 150),
      referredTID: tid,
    });
  }

  // ─── MASTER AUDIENCE SYNC (Stores all leads in Visitors) ───
  syncLeadToVisitors(ss, data);

  // ─── CITY REQUEST NOTIFICATION ───
  if (typeUpper === 'CITYREQUEST') {
    const locationParts = [data.city, data.state, data.country].filter(Boolean);
    const locationStr = locationParts.join(', ');
    const contactParts = [data.email, data.phone].filter(Boolean);
    const contactStr = contactParts.join(' | ');

    notifyDiscord('🏙️ New City Requested',
      `**Name:** ${sanitize(data.name, 100)}\n**Contact:** ${sanitize(contactStr, 200)}\n**Requested City:** ${sanitize(locationStr, 200)}`,
      3447003);
    return respond({ success: true, transactionID: tid });
  }

  // ─── GENERAL DISCORD ALERT ───
  notifyDiscord('📝 New ' + data.type,
    `**Name:** ${sanitize(data.name, 50)}\n**Email:** ${(data.email || 'N/A')}\n**ID:** ${tid}`, 3447003);

  // ─── VENDOR FREE PROFILE WELCOME EMAIL ───
  if (typeUpper === 'VENDOR' && data.email) {
    const isFree = !data.tier || data.tier.toLowerCase() === 'free';
    if (isFree) {
      sendEmail('VENDOR_FREE', {
        email: data.email,
        name: data.name || 'Vendor',
        business: data.businessName || '',
        category: data.category || 'General',
        tid: tid,
      });
    }
  }

  return respond({ success: true, transactionID: tid });
}

/* ─── Action: getVenues ─── */
function handleGetVenues(ss) {
  const sheet = ss.getSheetByName('Venues');
  if (!sheet) return respond({ error: 'Venues sheet not found' });

  const rows = sheet.getDataRange().getValues();
  const colMap = getColMap(sheet);
  if (rows.length < 2) return respond([]);

  const venues = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const venueName = colMap['VenueName'] ? String(r[colMap['VenueName'] - 1] || '').trim() : '';
    if (!venueName) continue;
    venues.push({
      timestamp: colMap['Timestamp'] ? String(r[colMap['Timestamp'] - 1] || '') : '',
      status: colMap['Status'] ? String(r[colMap['Status'] - 1] || '') : '',
      venueName,
      contactName: colMap['ContactName'] ? String(r[colMap['ContactName'] - 1] || '') : '',
      email: colMap['Email'] ? String(r[colMap['Email'] - 1] || '') : '',
      phone: colMap['Phone'] ? String(r[colMap['Phone'] - 1] || '') : '',
      location: colMap['Location'] ? String(r[colMap['Location'] - 1] || '') : '',
      city: colMap['City'] ? String(r[colMap['City'] - 1] || '') : '',
      capacity: colMap['Capacity'] ? String(r[colMap['Capacity'] - 1] || '') : '',
      hasParking: colMap['HasParking'] ? String(r[colMap['HasParking'] - 1] || '') : '',
      hasWiFi: colMap['HasWiFi'] ? String(r[colMap['HasWiFi'] - 1] || '') : '',
      indoorOutdoor: colMap['IndoorOutdoor'] ? String(r[colMap['IndoorOutdoor'] - 1] || '') : '',
      notes: colMap['Notes'] ? String(r[colMap['Notes'] - 1] || '') : '',
      contractURL: colMap['ContractURL'] ? String(r[colMap['ContractURL'] - 1] || '') : '',
      eventDate: colMap['EventDate'] ? String(r[colMap['EventDate'] - 1] || '') : '',
      lastUpdated: colMap['LastUpdated'] ? String(r[colMap['LastUpdated'] - 1] || '') : '',
    });
  }
  return respond(venues);
}

/* ─── Action: getCities ─── */
function handleGetCities(ss) {
  const sheet = ss.getSheetByName('Cities');
  if (!sheet) return respond([]);

  const rows = sheet.getDataRange().getValues();
  const colMap = getColMap(sheet);
  if (rows.length < 2) return respond([]);

  const cities = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = colMap['Name'] ? String(r[colMap['Name'] - 1] || '').trim() : '';
    if (!name) continue;
    cities.push({
      name,
      status: colMap['Status'] ? String(r[colMap['Status'] - 1] || '') : '',
      date: colMap['Date'] ? String(r[colMap['Date'] - 1] || '') : '',
    });
  }
  return respond(cities.slice(0, 50));
}

/* ─── Action: updateCities ─── */
function handleUpdateCities(ss, data) {
  const cities = data && Array.isArray(data.cities) ? data.cities : null;
  if (!cities) return respond({ error: 'Missing cities array' });

  const sheet = ensureSheet(ss, 'Cities');
  sheet.clearContents().clearFormats();
  sheet.getRange(1, 1, 1, 4).setValues([['Name', 'Status', 'Date', 'LastUpdated']])
    .setBackground('#1B7FDC').setFontColor('#ffffff').setFontWeight('bold');

  if (cities.length > 0) {
    const writeRows = cities.map(c => [
      sanitize(c.name, 100),
      sanitize(c.status || 'Planned', 50),
      sanitize(c.date || '', 50),
      nowISO(),
    ]);
    sheet.getRange(2, 1, writeRows.length, 4).setValues(writeRows);
  }
  SpreadsheetApp.flush();
  return respond({ success: true, count: cities.length });
}

/* ─── Action: updateStatus ─── */
function handleUpdateStatus(ss, data) {
  const map = { VENDOR: 'Vendors', ATTENDEE: 'Attendees' };
  const name = map[(data.type || '').toUpperCase()];
  if (!name) return respond({ error: 'Invalid type' });

  const tid = sanitize(data.transactionID, 50);
  if (!tid) return respond({ error: 'Missing transactionID' });

  const sheet = ss.getSheetByName(name);
  if (!sheet) return respond({ error: 'Sheet not found' });

  const rowIdx = findRowByTID(sheet, tid);
  if (rowIdx === -1) return respond({ error: 'Transaction not found' });

  const colMap = getColMap(sheet);
  if (colMap['Status']) sheet.getRange(rowIdx, colMap['Status']).setValue(sanitize(data.status, 50));
  if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
  if (data.receiptURL && colMap['ReceiptURL']) sheet.getRange(rowIdx, colMap['ReceiptURL']).setValue(sanitize(data.receiptURL, 500));
  if (data.stripeSessionID && colMap['StripeSessionID']) sheet.getRange(rowIdx, colMap['StripeSessionID']).setValue(sanitize(data.stripeSessionID, 100));

  SpreadsheetApp.flush();

  // ─── REFERRAL LOCK: a completed payment makes the linked referral payable ───
  if (data.status === 'Paid' || data.status === 'Confirmed' || data.status === 'Deposit Paid') {
    markReferralPayable(ss, tid);
  }

  // Vendor-specific extras from Stripe metadata
  if (name === 'Vendors' && colMap['Event'] && data.event) {
    sheet.getRange(rowIdx, colMap['Event']).setValue(sanitize(data.event, 100));
  }
  if (name === 'Vendors' && colMap['BusinessName'] && data.businessName) {
    sheet.getRange(rowIdx, colMap['BusinessName']).setValue(sanitize(data.businessName, 150));
  }
  if (name === 'Vendors' && colMap['Amount'] && data.ticketType) {
    // ticketType carries the resolved tier on vendor deposits
    sheet.getRange(rowIdx, colMap['Tier']).setValue(sanitize(data.ticketType, 20));
  }
  SpreadsheetApp.flush();

  const paid = data.status === 'Paid' || data.status === 'Confirmed' || data.status === 'Deposit Paid';
  notifyDiscord(paid ? '💰 Payment Received' : '🔄 Status Update',
    `**Type:** ${data.type}\n**ID:** ${tid.slice(0, 8)}***\n**Status:** ${data.status}`,
    paid ? 3066993 : 15105570);

  return respond({ success: true });
}

/* ═══════════════════════════════════════════
   REFERRAL SYSTEM (Register / Lookup / Track / Payout)
   ═══════════════════════════════════════════ */

const ROOT_URL = PROPS.getProperty('ROOT_URL') || 'https://marketpeace.isira.club';

/**
 * Validates a referrer code, and if valid appends a referral Pending row.
 * Called automatically from handleSubmit for any applicable form type.
 */
function recordReferralIfValid(ss, ref) {
  if (!ref || !ref.code) return false;
  const referrers = ss.getSheetByName('Referrers');
  if (!referrers) return false;
  const rows = referrers.getDataRange().getValues();
  const code = String(ref.code).trim().toUpperCase();
  let referrer = null;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '').trim().toUpperCase() === code) {
      referrer = { name: String(rows[i][1] || ''), email: String(rows[i][2] || '') };
      break;
    }
  }
  if (!referrer) return false;

  const sheet = ensureSheet(ss, 'Referrals');
  const refers = sheet.getDataRange().getValues();
  // Duplicate guard: same referrer + same referred TID must not double-record
  for (let i = 1; i < refers.length; i++) {
    if (String(refers[i][1] || '').trim().toUpperCase() === code && String(refers[i][7] || '') === ref.referredTID) return false;
  }

  sheet.appendRow([
    nowISO(), code, referrer.name, referrer.email,
    ref.referredType, ref.referredName, ref.referredBusiness || '',
    ref.referredTID, 'Pending', 0, 0, 'Pending', '', '', '', nowISO(),
  ]);
  SpreadsheetApp.flush();
  notifyDiscord('🤝 New Referral Recorded',
    `**Referrer Code:** ${code}\n**Referred Type:** ${ref.referredType}\n**Referred:** ${ref.referredName}${ref.referredBusiness ? ' / ' + ref.referredBusiness : ''}`,
    3447003);
  return true;
}

/**
 * Marks a referral payable once the referred party has paid.
 * Called from handleUpdateStatus on Paid/Confirmed.
 */
function markReferralPayable(ss, tid) {
  const sheet = ss.getSheetByName('Referrals');
  if (!sheet || !tid) return;
  const rows = sheet.getDataRange().getValues();
  const colMap = getColMap(sheet);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][7] || '') === String(tid)) {
      const status = colMap['Status'];
      const payout = colMap['PayoutStatus'];
      const verifiedAt = colMap['VerifiedAt'];
      if (status) sheet.getRange(i + 1, status).setValue('Deposit Paid');
      if (payout) sheet.getRange(i + 1, payout).setValue('Pending');
      if (verifiedAt) sheet.getRange(i + 1, verifiedAt).setValue(nowISO());
      SpreadsheetApp.flush();
      break;
    }
  }
}

/* ─── Action: registerReferrer ─── */
function handleRegisterReferrer(ss, data) {
  const name = sanitize(data.name, 100);
  const email = sanitize(data.email, 254).toLowerCase();
  const phone = sanitize(data.phone, 30);
  const payoutMethod = sanitize(data.payoutMethod || 'paypal', 30);
  const platform = sanitize(data.platform || 'website', 50);
  const type = sanitize(data.type || 'referrer', 50);

  if (name.length < 2) return respond({ error: 'Name is required (min 2 characters).' });
  if (!email.includes('@')) return respond({ error: 'Valid email is required.' });

  const sheet = ensureSheet(ss, 'Referrers');
  const rows = sheet.getDataRange().getValues();

  // If they already have a code, return it instead of generating a new one
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2] || '').trim().toLowerCase() === email) {
      const existingCode = String(rows[i][4] || '').trim();
      if (existingCode) {
        return respond({ success: true, existing: true, code: existingCode, shareLink: ROOT_URL + '/vendors?ref=' + existingCode });
      }
    }
  }

  // Generate a unique MP-XXXX-XXX code
  const used = new Set(rows.slice(1).map(r => String(r[4] || '').trim().toUpperCase()));
  const slug = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'USER';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let attempts = 0;
  do {
    let rand = '';
    for (let i = 0; i < 3; i++) rand += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    code = 'MP-' + slug + '-' + rand;
    attempts++;
  } while (used.has(code) && attempts < 25);

  sheet.appendRow([nowISO(), name, email, phone, code, platform, payoutMethod, type, 'Active', 0, 0, 0, nowISO()]);
  SpreadsheetApp.flush();

  syncLeadToVisitors(ss, { email, name, phone, type: 'Referral', source: 'Referral' });
  sendReferralWelcome(name, email, code);
  notifyDiscord('🎁 New Referrer Registered',
    `**Name:** ${name}\n**Code:** ${code}\n**Method:** ${payoutMethod}`,
    3066993);

  return respond({ success: true, existing: false, code, shareLink: ROOT_URL + '/vendors?ref=' + code });
}

/* ─── Action: lookupReferrer ─── */
function handleLookupReferrer(ss, data) {
  const code = sanitize(data.code, 50).trim().toUpperCase();
  if (!code) return respond({ error: 'Missing code' });
  const sheet = ss.getSheetByName('Referrers');
  if (!sheet) return respond({ found: false });

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '').trim().toUpperCase() === code) {
      return respond({
        found: true,
        code,
        name: String(rows[i][1] || ''),
        totalReferrals: Number(rows[i][9]) || 0,
        totalCash: Number(rows[i][10]) || 0,
        totalCredit: Number(rows[i][11]) || 0,
      });
    }
  }
  return respond({ found: false });
}

/* ─── Action: listReferrals (admin) ─── */
function handleListReferrals(ss) {
  const sheet = ss.getSheetByName('Referrals');
  const referrers = ss.getSheetByName('Referrers');
  if (!sheet) return respond([]);

  const rows = sheet.getDataRange().getValues();
  const colMap = getColMap(sheet);
  const out = [];
  const referrerMap = {};
  if (referrers) {
    referrers.getDataRange().getValues().slice(1).forEach(r => {
      referrerMap[String(r[4] || '').trim().toUpperCase()] = {
        name: String(r[1] || ''), email: String(r[2] || ''), method: String(r[6] || ''), type: String(r[7] || ''),
      };
    });
  }
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (colMap['Ref'] || true) out.push({
      timestamp: String(r[0] || ''),
      referrerCode: String(r[1] || ''),
      referrerName: String(r[2] || ''),
      referrerEmail: String(r[3] || ''),
      referredType: String(r[4] || ''),
      referredName: String(r[5] || ''),
      referredBusiness: String(r[6] || ''),
      referredTID: String(r[7] || ''),
      status: String(r[8] || ''),
      cashReward: Number(r[9]) || 0,
      creditReward: Number(r[10]) || 0,
      payoutStatus: String(r[11] || ''),
      payoutDate: String(r[13] || ''),
    });
  }
  return respond({ entries: out.slice(-500).reverse(), referrers: referrerMap });
}

/* ─── Action: payoutReferrals (admin) ─── */
const REFERRAL_REWARDS = {
  VENDOR: { cash: 50, credit: 50 },
  VENUE: { cash: 75, credit: 75 },
  ATTENDEE: { cash: 25, credit: 25 },
};

function handlePayoutReferrals(ss, data) {
  const sheet = ss.getSheetByName('Referrals');
  if (!sheet) return respond({ error: 'Referrals sheet not found' });

  const rows = sheet.getDataRange().getValues();
  const colMap = getColMap(sheet);
  const payoutMethod = sanitize(data.payoutMethod || 'paypal', 30);
  const entries = [];
  const byReferrer = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const status = String(r[8] || '');
    const payoutStatus = String(r[11] || '');
    if (payoutStatus === 'Paid') continue;
    if (status !== 'Deposit Paid' && status !== 'Verified') continue;

    const referredType = String(r[4] || '').toUpperCase();
    const reward = REFERRAL_REWARDS[referredType] || { cash: 0, credit: 0 };
    const code = String(r[1] || '').trim().toUpperCase();
    if (!code) continue;

    // Write reward amounts + mark paid for this run
    if (colMap['CashReward']) sheet.getRange(i + 1, colMap['CashReward']).setValue(reward.cash);
    if (colMap['CreditReward']) sheet.getRange(i + 1, colMap['CreditReward']).setValue(reward.credit);
    if (colMap['PayoutStatus']) sheet.getRange(i + 1, colMap['PayoutStatus']).setValue('Paid');
    if (colMap['PayoutMethod']) sheet.getRange(i + 1, colMap['PayoutMethod']).setValue(payoutMethod);
    if (colMap['PayoutDate']) sheet.getRange(i + 1, colMap['PayoutDate']).setValue(nowISO());

    if (!byReferrer[code]) byReferrer[code] = { cash: 0, credit: 0, count: 0, types: {} };
    byReferrer[code].cash += reward.cash;
    byReferrer[code].credit += reward.credit;
    byReferrer[code].count += 1;
    byReferrer[code].types[referredType] = (byReferrer[code].types[referredType] || 0) + 1;

    entries.push({
      code,
      referredType,
      referredName: String(r[5] || ''),
      referredBusiness: String(r[6] || ''),
      cash: reward.cash,
      credit: reward.credit,
    });
  }

  // Apply milestone bonuses (3 vendors / 5 vendors / swarm 10 / venue chain 3)
  Object.keys(byReferrer).forEach(code => {
    const info = byReferrer[code];
    const vendors = info.types['VENDOR'] || 0;
    const venues = info.types['VENUE'] || 0;
    if (vendors >= 3) info.cash += 50;
    if (vendors >= 5) info.cash += 100;
    if (vendors >= 10) info.cash += 100;
    if (venues >= 3) info.cash += 75;
  });

  const summary = Object.keys(byReferrer).map(code => ({
    code,
    cash: byReferrer[code].cash,
    credit: byReferrer[code].credit,
    count: byReferrer[code].count,
  }));

  // Reflect bonus changes back into Referrers totals
  const referrers = ss.getSheetByName('Referrers');
  if (referrers) {
    const rRows = referrers.getDataRange().getValues();
    const rMap = getColMap(referrers);
    for (let i = 1; i < rRows.length; i++) {
      const code = String(rRows[i][4] || '').trim().toUpperCase();
      if (!byReferrer[code]) continue;
      const curReferrals = Number(rRows[i][9]) || 0;
      if (rMap['TotalReferrals']) referrers.getRange(i + 1, rMap['TotalReferrals']).setValue(curReferrals + byReferrer[code].count);
      if (rMap['TotalCash']) referrers.getRange(i + 1, rMap['TotalCash']).setValue(Number(rRows[i][10] || 0) + byReferrer[code].cash);
      if (rMap['TotalCredit']) referrers.getRange(i + 1, rMap['TotalCredit']).setValue(Number(rRows[i][11] || 0) + byReferrer[code].credit);
    }
    SpreadsheetApp.flush();
  }

  const totalCash = summary.reduce((a, b) => a + b.cash, 0);
  const totalCredit = summary.reduce((a, b) => a + b.credit, 0);
  SpreadsheetApp.flush();

  if (summary.length > 0) {
    notifyDiscord('💸 Referral Payout Run', `**Referrers:** ${summary.length}\n**Cash:** $${totalCash}\n**Credit:** $${totalCredit}\n**Method:** ${payoutMethod}`, 15844367);
  }

  return respond({ success: true, payoutMethod, entries, summary, totalCash, totalCredit });
}

/* ═══════════════════════════════════════════
   ADMIN DASHBOARD (getDash)
   ═══════════════════════════════════════════ */

function numberCell(defaultVal) {
  if (typeof defaultVal !== 'number') defaultVal = 0;
  return defaultVal;
}

function handleGetDash(ss) {
  const dash = {
    vendors: { total: 0, paid: 0, pending: 0, revenue: 0 },
    attendees: { total: 0, paid: 0, revenue: 0 },
    venues: { total: 0, approved: 0 },
    referrals: { referrers: 0, pending: 0, payable: 0, cashOwed: 0 },
    promoters: { active: 0 },
    staff: 0,
    sponsors: 0,
    events: [],
    updatedAt: nowISO(),
  };

  const vendorSheet = ss.getSheetByName('Vendors');
  if (vendorSheet) {
    const rows = vendorSheet.getDataRange().getValues();
    const c = getColMap(vendorSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const status = String(c['Status'] ? r[c['Status'] - 1] || '' : '');
      const amount = Number(c['Amount'] ? r[c['Amount'] - 1] || 0 : 0) || 0;
      dash.vendors.total++;
      if (status === 'Paid' || status === 'Confirmed' || status === 'Deposit Paid') {
        dash.vendors.paid++;
        dash.vendors.revenue += amount;
      } else if (status === 'Pending' || status === 'Offer Sent' || status === 'Waiting List') {
        dash.vendors.pending++;
      }
    }
  }

  const attendeeSheet = ss.getSheetByName('Attendees');
  if (attendeeSheet) {
    const rows = attendeeSheet.getDataRange().getValues();
    const c = getColMap(attendeeSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const status = String(c['Status'] ? r[c['Status'] - 1] || '' : '');
      const amount = Number(c['Amount'] ? r[c['Amount'] - 1] || 0 : 0) || 0;
      dash.attendees.total++;
      if (status === 'Paid' || status === 'Confirmed') {
        dash.attendees.paid++;
        dash.attendees.revenue += amount;
      }
    }
  }

  const venueSheet = ss.getSheetByName('Venues');
  if (venueSheet) {
    const rows = venueSheet.getDataRange().getValues();
    const c = getColMap(venueSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const status = String(c['Status'] ? r[c['Status'] - 1] || '' : '');
      dash.venues.total++;
      if (status === 'Approved' || status === 'Active') dash.venues.approved++;
    }
  }

  const refSheet = ss.getSheetByName('Referrals');
  if (refSheet) {
    const rows = refSheet.getDataRange().getValues();
    const c = getColMap(refSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const status = String(c['Status'] ? r[c['Status'] - 1] || '' : '');
      const payout = String(c['PayoutStatus'] ? r[c['PayoutStatus'] - 1] || '' : '');
      if (payout !== 'Paid' && (status === 'Pending')) dash.referrals.pending++;
      if (payout !== 'Paid' && (status === 'Deposit Paid' || status === 'Verified')) {
        dash.referrals.payable++;
        dash.referrals.cashOwed += (Number(c['CashReward'] ? r[c['CashReward'] - 1] || 0 : 0) || 0);
      }
    }
  }

  const referrerSheet = ss.getSheetByName('Referrers');
  if (referrerSheet) dash.referrals.referrers = Math.max(0, referrerSheet.getLastRow() - 1);

  const promoterSheet = ss.getSheetByName('Promoters');
  if (promoterSheet) {
    const rows = promoterSheet.getDataRange().getValues();
    const c = getColMap(promoterSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (String(c['Status'] ? r[c['Status'] - 1] || '' : '') === 'Active') dash.promoters.active++;
    }
  }

  const staffSheet = ss.getSheetByName('Staff');
  if (staffSheet) dash.staff = Math.max(0, staffSheet.getLastRow() - 1);

  const sponsorSheet = ss.getSheetByName('Sponsors');
  if (sponsorSheet) dash.sponsors = Math.max(0, sponsorSheet.getLastRow() - 1);

  const eventSheet = ss.getSheetByName('Events');
  if (eventSheet) {
    const rows = eventSheet.getDataRange().getValues();
    const c = getColMap(eventSheet);
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = String(c['EventName'] ? r[c['EventName'] - 1] || '' : '');
      if (!name) continue;
      dash.events.push({
        name,
        city: String(c['City'] ? r[c['City'] - 1] || '' : ''),
        venue: String(c['Venue'] ? r[c['Venue'] - 1] || '' : ''),
        date: String(c['EventDate'] ? r[c['EventDate'] - 1] || '' : ''),
        capacity: Number(c['Capacity'] ? r[c['Capacity'] - 1] || 0 : 0) || 0,
        status: String(c['Status'] ? r[c['Status'] - 1] || '' : ''),
      });
    }
  }

  return respond(dash);
}

/* ═══════════════════════════════════════════
   CRON: 70% CAPACITY FINALIZATION
   ═══════════════════════════════════════════ */

function cronCapacityCheck() {
  const ss = getSS();
  Logger.log('Capacity cron result: ' + JSON.stringify(handleCronCapacityCheck(ss)));
}

function handleCronCapacityCheck(ss) {
  const eventSheet = ss.getSheetByName('Events');
  const vendorSheet = ss.getSheetByName('Vendors');
  if (!eventSheet || !vendorSheet) return respond({ events: 0, notified: 0 });

  const events = eventSheet.getDataRange().getValues();
  const eMap = getColMap(eventSheet);
  const vendors = vendorSheet.getDataRange().getValues();
  const vMap = getColMap(vendorSheet);
  let notified = 0;
  const DONE = ['Completed', 'Cancelled'];

  for (let i = 1; i < events.length; i++) {
    const r = events[i];
    const evName = sanitize(String(eMap['EventName'] ? r[eMap['EventName'] - 1] || '' : ''), 200);
    const capacity = Number(eMap['Capacity'] ? r[eMap['Capacity'] - 1] || 0 : 0) || 0;
    const notifiedRaw = String(eMap['NotifiedAt'] ? r[eMap['NotifiedAt'] - 1] || '' : '').trim();
    const evStatus = String(eMap['Status'] ? r[eMap['Status'] - 1] || '' : '').trim();
    if (!evName || capacity <= 0 || notifiedRaw || DONE.indexOf(evStatus) !== -1) continue;

    // Count committed vendors (paid)
    const waiting = [];
    const sold = vendors.slice(1).reduce((acc, vr) => {
      const vEvent = String(vMap['Event'] ? vr[vMap['Event'] - 1] || '' : '').trim();
      const vStatus = String(vMap['Status'] ? vr[vMap['Status'] - 1] || '' : '').trim();
      if (vEvent !== evName) return acc;
      if (vStatus === 'Paid' || vStatus === 'Confirmed' || vStatus === 'Deposit Paid') return acc + 1;
      if (vStatus === 'Pending' || vStatus === 'Offer Sent' || vStatus === 'Offer Follow-Up' || vStatus === 'Waiting List') {
        waiting.push({ row: vr, map: vMap });
      }
      return acc;
    }, 0);

    // 70% threshold reached
    if (sold >= Math.ceil(capacity * 0.7)) {
      waiting.forEach(w => {
        const email = String(w.map['Email'] ? w.row[w.map['Email'] - 1] || '' : '').trim();
        const name = String(w.map['Name'] ? w.row[w.map['Name'] - 1] || '' : '').trim();
        const business = String(w.map['BusinessName'] ? w.row[w.map['BusinessName'] - 1] || '' : '').trim();
        const link = String(w.map['PaymentLinkURL'] ? w.row[w.map['PaymentLinkURL'] - 1] || '' : '').trim();
        if (email) sendFinalizeEmail({ name, business, email, event: evName, link });
      });
      notified++;
      const rowIdx = i + 1;
      if (eMap['NotifiedAt']) eventSheet.getRange(rowIdx, eMap['NotifiedAt']).setValue(nowISO());
      if (eMap['SoldCount']) eventSheet.getRange(rowIdx, eMap['SoldCount']).setValue(sold);
      if (eMap['Status']) eventSheet.getRange(rowIdx, eMap['Status']).setValue('Active');
      SpreadsheetApp.flush();
      notifyDiscord('🎟️ 70% Capacity Reached',
        `**Event:** ${evName}\n**Sold:** ${sold}/${capacity}\n**Notified:** ${waiting.length} waiting-list vendors`, 15844367);
    } else if (eMap['SoldCount']) {
      eventSheet.getRange(i + 1, eMap['SoldCount']).setValue(sold);
      SpreadsheetApp.flush();
    }
  }

  return respond({ events: events.length, notified });
}

function sendFinalizeEmail(v) {
  if (!v.email) return;
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f1b24;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#0DB8D3;font-size:28px;letter-spacing:8px;margin:0;">MARKETPEACE</h1>
    <p style="color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:8px;">THE INFRASTRUCTURE OF INDEPENDENCE</p>
  </div>
  <div style="background:#193546;border:1px solid rgba(13,184,211,0.2);border-radius:16px;padding:32px;">
    <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Booth Is Ready to Lock In</p>
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px 0;">Hey ${sanitize(v.name, 50)},</h2>
    <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Great news — <strong style="color:#ffffff;">${sanitize(v.event, 100)}</strong> just reached 70% capacity. Your booth spot is being finalized. Pay your remaining balance within 48 hours to lock it in.</p>
    ${v.link ? `<div style="text-align:center;margin-bottom:8px;">
      <a href="${v.link}" style="display:inline-block;background:#0DB8D3;color:#0f1b24;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;padding:16px 40px;border-radius:12px;">PAY BALANCE NOW</a>
    </div>` : '<p style="color:#fbbf24;font-size:13px;">A payment link will be sent to you separately.</p>'}
    <p style="color:#6b7280;font-size:11px;text-align:center;margin-top:16px;">Questions? foreignaffairsllc2017@gmail.com</p>
  </div>
</div></body></html>`;
  try {
    MailApp.sendEmail({
      to: v.email,
      subject: `${sanitize(v.name.split(' ')[0], 30)}, ${sanitize(v.event, 60)} just hit 70% capacity`,
      body: `Hello ${v.name},\n\nGreat news — ${v.event} just reached 70% capacity. Your booth spot is being finalized. Pay your remaining balance within 48 hours to lock it in.\n\n${v.link ? 'Pay now: ' + v.link : 'A payment link will be sent separately.'}\n\nQuestions? foreignaffairsllc2017@gmail.com`,
      name: 'MARKETPEACE',
    });
  } catch (e) {
    console.error('Finalize email error:', e.toString());
  }
}

function sendReferralWelcome(name, email, code) {
  if (!email) return;
  const shareURL = ROOT_URL + '/vendors?ref=' + code;
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f1b24;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#0DB8D3;font-size:28px;letter-spacing:8px;margin:0;">MARKETPEACE</h1>
    <p style="color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:8px;">THE INFRASTRUCTURE OF INDEPENDENCE</p>
  </div>
  <div style="background:#193546;border:1px solid rgba(13,184,211,0.2);border-radius:16px;padding:32px;">
    <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Referral Code Is Live</p>
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px 0;">Welcome to Marketpeace, ${sanitize(name, 50)}</h2>
    <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Share your code and earn cash + credit for every vendor, venue and attendee you bring in.
    </p>
    <div style="text-align:center;background:#0f1b24;border:1px solid rgba(13,184,211,0.4);border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#6b7280;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Code</p>
      <p style="color:#0DB8D3;font-size:32px;font-weight:bold;letter-spacing:4px;margin:0;">${code}</p>
    </div>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${shareURL}" style="display:inline-block;background:#0DB8D3;color:#0f1b24;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;padding:16px 40px;border-radius:12px;">COPY &amp; SHARE YOUR LINK</a>
    </div>
    <p style="color:#6b7280;font-size:11px;text-align:center;margin-top:16px;">Questions? foreignaffairsllc2017@gmail.com</p>
  </div>
</div></body></html>`;
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Your Marketpeace referral code is ready',
      htmlBody,
      body: `Welcome ${name}!\n\nYour referral code is: ${code}\n\nShare this link to earn cash + credit:\n${shareURL}\n\nQuestions? foreignaffairsllc2017@gmail.com`,
      name: 'MARKETPEACE',
    });
  } catch (e) {
    console.error('Referral welcome email error:', e.toString());
  }
}

/* ═══════════════════════════════════════════
   ROW BUILDER (Matches Form Sheets)
   ═══════════════════════════════════════════ */
function buildRow(type, data, tid) {
  const s = (v, m) => sanitize(v, m);
  const ts = nowISO();

  switch (type) {
    case 'VENDOR':
      const isFree = !data.tier || data.tier.toLowerCase() === 'free';
      return [
        ts,
        tid,
        s(data.status || (isFree ? 'Free Profile' : 'Pending'), 50),
        s(data.name, 100),
        s(data.businessName, 150),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.instagram, 100),
        s(data.category || 'General', 100),
        s(isFree ? 'Free' : 'High-Ticket Lead', 50),
        s(data.website, 200),
        s(data.tier || 'Free', 20),
        s(data.amount || '0', 20),
        s(data.paymentMethod || 'free', 20),
        '', '', '', ts,
        '', '', '', '', '', (isFree ? 'N/A' : 'Pending AI'),
        '', '0',
        s(data.event, 100)
      ];

    case 'ATTENDEE':
      return [
        ts,
        tid,
        s(data.status || 'Registered', 50),
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.ticketType || 'Free', 30),
        s(data.amount || '0', 20),
        s(data.referrer, 100),
        s(data.notes, 500),
        ts
      ];

    case 'VENUE':
      return [
        ts,
        'In Review',
        s(data.venueName, 150),
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.location, 200),
        s(data.city, 100),
        s(data.capacity, 20),
        s(data.hasParking, 10),
        s(data.hasWiFi, 10),
        s(data.indoorOutdoor, 20),
        s(data.notes, 1000),
        s(data.eventDate, 50),
        ts
      ];

    case 'CONTACT':
      return [
        ts,
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 20),
        s(data.subject || 'General Inquiry', 200),
        s(data.message, 2000),
        s(data.source, 50),
        'No',
        '',
        ts
      ];

    case 'CITYREQUEST':
      const cityLoc = [data.city, data.state, data.country].filter(Boolean).join(', ');
      return [
        ts,
        s(data.name, 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 30),
        'City Request',
        s(`Requested City: ${cityLoc}. ${data.notes || ''}`, 2000),
        'CityRequestForm',
        'No',
        s(`City: ${cityLoc}`, 300),
        ts
      ];

    case 'VISITOR':
    case 'NEWSLETTER':
      return [
        ts,
        s(data.name || 'Subscriber', 100),
        s(data.email, 254).toLowerCase(),
        s(data.phone, 30),
        s(type === 'NEWSLETTER' ? 'Newsletter' : (data.source || 'LeadPopup'), 50),
        s(data.page || data.details || '/', 200),
        type === 'NEWSLETTER' ? 'Subscribed' : 'Lead',
        ts
      ];

    default:
      return [ts, tid, s(data.name, 100), s(data.email, 254).toLowerCase(), s(data.notes, 500), ts];
  }
}

/* ═══════════════════════════════════════════
   CRON JOB: AI OFFER CREATION & STRICT EMAIL SENDING
   ═══════════════════════════════════════════ */

/**
 * Trigger-ready Cron function.
 * 1. Generates Subject and Body with AI for pending high-ticket vendors.
 * 2. STRICT VALIDATION: If and only if Subject AND Body are valid, sends email.
 * 3. Never double-sends (checks OfferStatus === 'Sent' and OfferSentAt).
 */
function cronProcessAIOffers() {
  const ss = getSS();
  const res = handleCronProcessAIOffers(ss);
  Logger.log('Cron execution result: ' + JSON.stringify(res));
}

function handleCronProcessAIOffers(ss) {
  const sheet = ensureSheet(ss, 'Vendors');
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return respond({ processed: 0, sent: 0 });

  const colMap = getColMap(sheet);
  let processedCount = 0;
  let sentCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowIdx = i + 1;
    const r = rows[i];

    const tid = colMap['TransactionID'] ? String(r[colMap['TransactionID'] - 1] || '') : '';
    const status = colMap['Status'] ? String(r[colMap['Status'] - 1] || '') : '';
    const tier = colMap['Tier'] ? String(r[colMap['Tier'] - 1] || '') : '';
    const email = colMap['Email'] ? String(r[colMap['Email'] - 1] || '') : '';
    const name = colMap['Name'] ? String(r[colMap['Name'] - 1] || '') : '';
    const businessName = colMap['BusinessName'] ? String(r[colMap['BusinessName'] - 1] || '') : '';
    const instagram = colMap['Instagram'] ? String(r[colMap['Instagram'] - 1] || '') : '';
    const category = colMap['Category'] ? String(r[colMap['Category'] - 1] || '') : '';

    const offerStatus = colMap['OfferStatus'] ? String(r[colMap['OfferStatus'] - 1] || '').trim() : '';
    const offerSentAt = colMap['OfferSentAt'] ? String(r[colMap['OfferSentAt'] - 1] || '').trim() : '';

    // Criteria: High-ticket booth applicant where offer has NOT been sent yet
    const isHighTicket = tier.toLowerCase() === 'standard' || tier.toLowerCase() === 'flagship';
    const isPending = status.toLowerCase() === 'pending' || offerStatus.toLowerCase() === 'pending ai';
    const alreadySent = offerStatus.toLowerCase() === 'sent' || offerSentAt.length > 0;

    if (isHighTicket && isPending && !alreadySent && email) {
      processedCount++;
      const vendorData = {
        name: name,
        businessName: businessName,
        email: email,
        instagram: instagram,
        category: category,
        tier: tier,
      };

      // ─── STEP 1: GENERATE OFFER WITH AI ───
      let offer;
      try {
        offer = generateCustomOffer(vendorData);
      } catch (aiErr) {
        console.error('AI Offer Generation failed:', aiErr.toString());
        offer = null;
      }

      // ─── STEP 2: BUILD SUBJECT & BODY ───
      const subject = offer && offer.amount
        ? `${sanitize(name, 50)}, your custom MARKETPEACE offer is ready — $${offer.amount}`
        : '';
      const body = offer && offer.proposal ? String(offer.proposal).trim() : '';

      // ─── STEP 3: STRICT VALIDATION GATE ───
      // "if body and subject created then only send the mail to them else dont send it"
      const isSubjectValid = typeof subject === 'string' && subject.length >= 10;
      const isBodyValid = typeof body === 'string' && body.length >= 25;
      const isAmountValid = offer && Number(offer.amount) > 0;

      if (!isSubjectValid || !isBodyValid || !isAmountValid) {
        Logger.log(`⚠️ Validation failed for row ${rowIdx} (${name}): Subject or Body not created properly. Skipping email.`);
        if (colMap['OfferStatus']) sheet.getRange(rowIdx, colMap['OfferStatus']).setValue('AI Generation Incomplete');
        if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
        SpreadsheetApp.flush();
        notifyDiscord('⚠️ AI Offer Skipped', `**Vendor:** ${name}\nSubject or body not generated. Email was NOT sent.`, 15158332);
        continue; // DO NOT SEND MAIL!
      }

      // ─── STEP 4: GENERATE PAYMENT LINK ───
      const paymentLink = createStripePaymentLink(
        offer.amount,
        `MARKETPEACE Vendor Registration — ${offer.boothRecommendation || tier || 'Standard'}`,
        { transactionID: tid, type: 'Vendor', tier: tier || 'Standard' }
      );

      // ─── STEP 5: SEND EMAIL ───
      const emailSent = sendOfferEmail(vendorData, offer, paymentLink, tid, subject);

      // ─── STEP 6: RECORD TO SHEET ATOMICALLY ───
      if (emailSent) {
        if (colMap['OfferAmount']) sheet.getRange(rowIdx, colMap['OfferAmount']).setValue(offer.amount);
        if (colMap['OfferSubject']) sheet.getRange(rowIdx, colMap['OfferSubject']).setValue(sanitize(subject, 200));
        if (colMap['OfferBody']) sheet.getRange(rowIdx, colMap['OfferBody']).setValue(sanitize(body, 2000));
        if (colMap['PaymentLinkURL']) sheet.getRange(rowIdx, colMap['PaymentLinkURL']).setValue(paymentLink);
        if (colMap['OfferSentAt']) sheet.getRange(rowIdx, colMap['OfferSentAt']).setValue(nowISO());
        if (colMap['OfferStatus']) sheet.getRange(rowIdx, colMap['OfferStatus']).setValue('Sent');
        if (colMap['Status']) sheet.getRange(rowIdx, colMap['Status']).setValue('Offer Sent');
        if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
        SpreadsheetApp.flush(); // Commit write

        sentCount++;
        notifyDiscord('🤖 AI Offer Sent (Cron)',
          `**Vendor:** ${sanitize(businessName || name, 50)}\n**Amount:** $${offer.amount}\n**Subject:** ${sanitize(subject, 100)}\n**Status:** Sent`,
          3066993);
      } else {
        if (colMap['OfferStatus']) sheet.getRange(rowIdx, colMap['OfferStatus']).setValue('Email Dispatch Failed');
        if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
        SpreadsheetApp.flush();
      }
    }
  }

  return respond({ success: true, processed: processedCount, sent: sentCount });
}

/* ═══════════════════════════════════════════
   CRON JOB: OFFER FOLLOW-UPS (Nudge unpaid vendors)
   ═══════════════════════════════════════════ */

/**
 * Trigger-ready Cron function.
 * 1. Scans Vendors where an AI offer was SENT but not yet paid.
 * 2. After FOLL_UP_DAYS with no payment, sends a polite nudge email
 *    re-forwarding the payment link.
 * 3. Max MAX_FOLLOW_UPS per vendor; records FollowUpAt + FollowUpCount.
 */
const FOLL_UP_DAYS = 3;      // days after offer sent to start nudging
const FOLLOW_UP_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // min gap between nudges
const MAX_FOLLOW_UPS = 3;

function cronProcessFollowUps() {
  const ss = getSS();
  const res = handleCronProcessFollowUps(ss);
  Logger.log('Follow-up cron execution result: ' + JSON.stringify(res));
}

function handleCronProcessFollowUps(ss) {
  const sheet = ss.getSheetByName('Vendors');
  if (!sheet) return respond({ processed: 0, sent: 0 });

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return respond({ processed: 0, sent: 0 });

  const colMap = getColMap(sheet);
  let processedCount = 0;
  let sentCount = 0;
  const now = new Date().getTime();

  for (let i = 1; i < rows.length; i++) {
    const rowIdx = i + 1;
    const r = rows[i];

    const status = colMap['Status'] ? String(r[colMap['Status'] - 1] || '').trim() : '';
    const offerStatus = colMap['OfferStatus'] ? String(r[colMap['OfferStatus'] - 1] || '').trim() : '';
    const offerSentAt = colMap['OfferSentAt'] ? String(r[colMap['OfferSentAt'] - 1] || '').trim() : '';
    const paymentLink = colMap['PaymentLinkURL'] ? String(r[colMap['PaymentLinkURL'] - 1] || '').trim() : '';
    const email = colMap['Email'] ? String(r[colMap['Email'] - 1] || '').trim() : '';
    const name = colMap['Name'] ? String(r[colMap['Name'] - 1] || '').trim() : '';
    const businessName = colMap['BusinessName'] ? String(r[colMap['BusinessName'] - 1] || '').trim() : '';
    const followUpAt = colMap['FollowUpAt'] ? String(r[colMap['FollowUpAt'] - 1] || '').trim() : '';
    const followUpCountRaw = colMap['FollowUpCount'] ? String(r[colMap['FollowUpCount'] - 1] || '0').trim() : '0';

    // Only vendors who got an offer and haven't paid
    const isOfferOutstanding = status !== 'Paid' && status !== 'Confirmed' && status !== 'Cancelled' && status !== 'Refunded';
    const offerWasSent = offerStatus.toLowerCase() === 'sent' || offerStatus.toLowerCase() === 'offer follow-up';
    const hasLink = paymentLink.length > 0 && email.length > 0;
    if (!isOfferOutstanding || !offerWasSent || !hasLink) continue;

    const followUpCount = parseInt(followUpCountRaw, 10) || 0;
    if (followUpCount >= MAX_FOLLOW_UPS) continue;

    // Determine the reference timestamp for the nudge window
    const refTs = followUpAt || offerSentAt;
    const refTime = refTs ? new Date(refTs).getTime() : 0;
    if (!refTime) continue;

    const daysSinceRef = (now - refTime) / (24 * 60 * 60 * 1000);
    const minDays = followUpCount === 0 ? FOLL_UP_DAYS : FOLLOW_UP_INTERVAL_MS / (24 * 60 * 60 * 1000);
    if (daysSinceRef < minDays) continue;

    processedCount++;

    const subject = `${name.split(' ')[0] || 'Friend'}, your MARKETPEACE booth is still reserved — pay now`;
    const sent = sendFollowUpEmail({ name, businessName, email, paymentLink, followUpCount: followUpCount + 1 });

    if (sent) {
      if (colMap['FollowUpAt']) sheet.getRange(rowIdx, colMap['FollowUpAt']).setValue(nowISO());
      if (colMap['FollowUpCount']) sheet.getRange(rowIdx, colMap['FollowUpCount']).setValue(followUpCount + 1);
      if (colMap['Status']) sheet.getRange(rowIdx, colMap['Status']).setValue('Offer Follow-Up');
      if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
      SpreadsheetApp.flush();
      sentCount++;
      notifyDiscord('🔁 Offer Follow-Up Sent (Cron)',
        `**Vendor:** ${sanitize(businessName || name, 50)}\n**Nudge #:** ${followUpCount + 1} of ${MAX_FOLLOW_UPS}`,
        15105570);
    } else {
      console.error(`Follow-up email failed for row ${rowIdx} (${name})`);
    }
  }

  return respond({ success: true, processed: processedCount, sent: sentCount });
}

function sendFollowUpEmail(v) {
  if (!v.email || !v.paymentLink) return false;
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f1b24;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#0DB8D3;font-size:28px;letter-spacing:8px;margin:0;">MARKETPEACE</h1>
    <p style="color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:8px;">THE INFRASTRUCTURE OF INDEPENDENCE</p>
  </div>
  <div style="background:#193546;border:1px solid rgba(13,184,211,0.2);border-radius:16px;padding:32px;">
    <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Booth Is Still Reserved</p>
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px 0;">Hey ${sanitize(v.name, 50)},</h2>
    <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Your custom MARKETPEACE booth offer for <strong style="color:#ffffff;">${sanitize(v.businessName || 'your brand', 100)}</strong> is still reserved, but the payment window is closing. Secure your spot before it opens to another creator.</p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${v.paymentLink}" style="display:inline-block;background:#0DB8D3;color:#0f1b24;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;padding:16px 40px;border-radius:12px;">SECURE YOUR SPOT</a>
    </div>
    <p style="color:#6b7280;font-size:11px;text-align:center;margin-top:16px;">Questions? foreignaffairsllc2017@gmail.com</p>
  </div>
</div></body></html>`;

  const plainText = [
    'MARKETPEACE — Your Booth Is Still Reserved',
    '',
    `Hey ${sanitize(v.name, 50)},`,
    '',
    `Your custom booth offer for ${sanitize(v.businessName || 'your brand', 100)} is still reserved, but the payment window is closing.`,
    '',
    `Secure your spot: ${v.paymentLink}`,
    '',
    'Questions? foreignaffairsllc2017@gmail.com',
  ].join('\n');

  try {
    MailApp.sendEmail({
      to: v.email,
      subject: `${sanitize(v.name.split(' ')[0], 30)}, your MARKETPEACE booth is still reserved`,
      body: plainText,
      htmlBody: htmlBody,
      name: 'MARKETPEACE',
    });
    return true;
  } catch (e) {
    console.error('Follow-up email error:', e.toString());
    return false;
  }
}

/* ═══════════════════════════════════════════
   ONE-TIME TRIGGER SETUP (run manually once)
   ═══════════════════════════════════════════ */
function setupTriggers() {
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('cronProcessAIOffers')
    .timeBased()
    .everyMinutes(10)
    .create();

  ScriptApp.newTrigger('cronProcessFollowUps')
    .timeBased()
    .everyHours(6)
    .create();

  ScriptApp.newTrigger('cronCapacityCheck')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('✅ Triggers created: cronProcessAIOffers (10m), cronProcessFollowUps (6h), cronCapacityCheck (1h)');
}

/* ═══════════════════════════════════════════
   AI OFFER GENERATION ENGINE
   ═══════════════════════════════════════════ */

function generateCustomOffer(vendor) {
  const brand = vendor.businessName || vendor.name || 'Independent Brand';
  const category = vendor.category || 'General Merchandise';
  const instagram = vendor.instagram || 'None provided';
  const tierPreference = (vendor.tier || 'Standard').toLowerCase();

  // Try NVIDIA NIM AI first if configured
  if (NVIDIA_NIM_API_KEY) {
    try {
      const prompt = `You are the lead curator for MARKETPEACE, a high-end streetwear and artisanal goods market.
A vendor just applied. Create a tailored booth proposal.
Brand Name: ${brand}
Category: ${category}
Instagram: ${instagram}
Tier Preference: ${tierPreference}

Respond with ONLY a JSON object in this exact schema:
{
  "amount": 250,
  "boothRecommendation": "Standard",
  "proposal": "2-3 sentences explaining why this brand fits MARKETPEACE and what dedicated placement is offered.",
  "perks": ["6ft Table & 2 Chairs", "Prime Placement", "Social Media Spotlight"]
}`;

      const response = UrlFetchApp.fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + NVIDIA_NIM_API_KEY,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 500,
        }),
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        let text = json.choices[0].message.content.trim();
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(text);
        if (parsed.amount && parsed.proposal) return parsed;
      }
    } catch (err) {
      console.warn('NVIDIA NIM call failed, using built-in engine:', err.toString());
    }
  }

  // Built-in intelligent pricing and proposal engine
  const isFlagship = tierPreference.includes('flagship') || tierPreference.includes('500');
  const amount = isFlagship ? 500 : 250;
  const boothRecommendation = isFlagship ? 'Flagship' : 'Standard';

  const proposal = isFlagship
    ? `We are thrilled to extend a Flagship Booth offer to ${brand}. Your work in ${category} brings distinctive value to our curated lineup. This package includes a premium corner booth, featured placement on all marketing channels, and priority VIP attendee access.`
    : `We are excited to invite ${brand} to MARKETPEACE with a Standard Booth package. Your presence in the ${category} category fits our aesthetic perfectly. This spot includes a 6ft presentation table, 2 chairs, and dedicated social media inclusion.`;

  const perks = isFlagship
    ? ['Premium Corner Placement', 'Featured on Promotions', 'Social Media Shoutout', 'VIP Platform Listing']
    : ['6ft Table & 2 Chairs', 'Prime Placement', 'Event Listing Inclusion', 'Social Media Mention'];

  return { amount, boothRecommendation, proposal, perks };
}

/* ═══════════════════════════════════════════
   STRIPE PAYMENT LINK GENERATOR
   ═══════════════════════════════════════════ */

function createStripePaymentLink(amountDollars, description, metadata) {
  if (!STRIPE_SECRET_KEY) return '';

  try {
    const pricePayload = {
      unit_amount: Math.round(amountDollars * 100),
      currency: 'usd',
      'product_data[name]': sanitize(description, 200),
    };

    const priceResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/prices', {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
      payload: pricePayload,
      muteHttpExceptions: true,
    });

    if (priceResponse.getResponseCode() !== 200) return '';
    const price = JSON.parse(priceResponse.getContentText());

    const linkPayload = {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': 1,
      'after_completion[type]': 'redirect',
      'after_completion[redirect][url]': 'https://marketpeace.com/success?session_id={CHECKOUT_SESSION_ID}',
    };

    if (metadata) {
      Object.keys(metadata).forEach(key => {
        linkPayload['metadata[' + key + ']'] = sanitize(String(metadata[key]), 100);
      });
    }

    const linkResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_links', {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
      payload: linkPayload,
      muteHttpExceptions: true,
    });

    if (linkResponse.getResponseCode() !== 200) return '';
    const link = JSON.parse(linkResponse.getContentText());
    return link.url || '';
  } catch (err) {
    console.error('Stripe API error:', err.toString());
    return '';
  }
}

/* ═══════════════════════════════════════════
   EMAIL DISPATCH & TEMPLATES
   ═══════════════════════════════════════════ */

function sendOfferEmail(data, offer, paymentLink, tid, customSubject) {
  if (!data.email) return false;

  const perksHtml = (offer.perks || []).map(p =>
    `<li style="padding:4px 0;color:#d1d5db;font-size:14px;">✓ ${sanitize(p, 200)}</li>`
  ).join('');

  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f1b24;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#0DB8D3;font-size:28px;letter-spacing:8px;margin:0;">MARKETPEACE</h1>
    <p style="color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:8px;">THE INFRASTRUCTURE OF INDEPENDENCE</p>
  </div>
  <div style="background:#193546;border:1px solid rgba(13,184,211,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
    <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Custom Offer</p>
    <h2 style="color:#ffffff;font-size:24px;margin:0 0 16px 0;">Hey ${sanitize(data.name, 50)},</h2>
    <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 24px 0;">${sanitize(offer.proposal, 1000)}</p>
    <div style="background:rgba(13,184,211,0.1);border:1px solid rgba(13,184,211,0.2);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;margin:0 0 4px 0;">YOUR PRICE</p>
      <p style="color:#ffffff;font-size:36px;font-weight:bold;margin:0;">$${offer.amount}</p>
      <p style="color:#6b7280;font-size:12px;margin:4px 0 0 0;">${sanitize(offer.boothRecommendation, 20)} Booth</p>
    </div>
    <p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0 0 12px 0;letter-spacing:1px;">WHAT'S INCLUDED:</p>
    <ul style="list-style:none;padding:0;margin:0 0 24px 0;">${perksHtml}</ul>
    ${paymentLink ? `
    <div style="text-align:center;">
      <a href="${paymentLink}" style="display:inline-block;background:#0DB8D3;color:#0f1b24;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;padding:16px 40px;border-radius:12px;">SECURE YOUR SPOT →</a>
    </div>` : '<p style="color:#fbbf24;font-size:13px;text-align:center;">Payment link will follow shortly.</p>'}
  </div>
  <div style="text-align:center;padding:20px 0;">
    <p style="color:#6b7280;font-size:11px;margin:0 0 4px 0;">Transaction ID: ${sanitize(tid, 50)}</p>
    <p style="color:#6b7280;font-size:11px;margin:0 0 4px 0;">Questions? Reply to this email or contact foreignaffairsllc2017@gmail.com</p>
  </div>
</div></body></html>`;

  const plainText = [
    'MARKETPEACE — Your Custom Vendor Offer',
    '',
    `Hey ${sanitize(data.name, 50)},`,
    '',
    offer.proposal,
    '',
    `Your Price: $${offer.amount} (${offer.boothRecommendation} Booth)`,
    '',
    'What\'s included:',
    (offer.perks || []).map(p => `  ✓ ${p}`).join('\n'),
    '',
    paymentLink ? `Secure your spot: ${paymentLink}` : 'Payment link will be sent shortly.',
    '',
    `Transaction ID: ${tid}`,
    'Questions? foreignaffairsllc2017@gmail.com',
  ].join('\n');

  const emailSubject = customSubject || `${sanitize(data.name, 50)}, your custom MARKETPEACE offer is ready — $${offer.amount}`;

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: emailSubject,
      body: plainText,
      htmlBody: htmlBody,
      name: 'MARKETPEACE',
    });
    return true;
  } catch (e) {
    console.error('Offer email failed:', e.toString());
    return false;
  }
}

function sendEmail(type, d) {
  if (!d.email) return;

  if (type === 'VENDOR_FREE') {
    try {
      MailApp.sendEmail({
        to: d.email,
        subject: "Welcome to MARKETPEACE! Your Free Vendor Profile is Live",
        body: [
          `Hi ${d.name || 'Vendor'},`,
          '',
          `Welcome to MARKETPEACE! Your vendor profile for ${d.business || 'your brand'} has been created.`,
          '',
          '── Profile Info ──',
          `Business: ${d.business || 'N/A'}`,
          `Category: ${d.category || 'General'}`,
          'Status: Active Free Profile',
          '',
          '── What Next ──',
          '• You will receive notifications when markets open in your area.',
          '• When you are ready for a physical booth or VIP placement, request a custom offer anytime.',
          '',
          'Questions? foreignaffairsllc2017@gmail.com',
          '',
          '— The MARKETPEACE Team',
        ].join('\n'),
        name: 'MARKETPEACE',
      });
    } catch (e) {
      console.error('Welcome email failed:', e.toString());
    }
  }
}

/* ═══════════════════════════════════════════
   DISCORD NOTIFIER
   ═══════════════════════════════════════════ */
function notifyDiscord(title, desc, color) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        embeds: [{
          title: sanitize(title, 200),
          description: sanitize(desc, 2000),
          color: color || 3447003,
          timestamp: new Date().toISOString(),
          footer: { text: 'MARKETPEACE Live Sync' },
        }],
      }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    console.error('Discord error:', e.toString());
  }
}

/* ═══════════════════════════════════════════
   RESPONSE HELPER
   ═══════════════════════════════════════════ */
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

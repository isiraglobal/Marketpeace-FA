/**
 * MARKETPEACE — Google Apps Script Backend v3
 *
 * Multi-sheet real-time sync engine with one-click setup.
 *
 * ─── ONE-TIME SETUP ───
 * 1. Open this sheet: https://docs.google.com/spreadsheets/d/1U4OAHwkntuIlcgWUbtAFJ2R0hBkyTqSJHtmmzsjEa1g
 * 2. Extensions → Apps Script, paste this file, save
 * 3. In the editor, run the `setupSheets()` function once (grants permissions)
 * 4. Project Settings → Script Properties → Add:
 *    - DISCORD_WEBHOOK_URL: Your Discord webhook URL
 *    - INTERNAL_SECRET: Strong random string (same as Vercel's INTERNAL_WEBHOOK_SECRET)
 *    - VENUE_WEBHOOK_URL: https://marketpeace.isira.club/api/venues/sync
 * 5. Deploy → New Deployment → Web app → Execute as: Me → Anyone
 * 6. Copy the deployment URL → set as GOOGLE_SCRIPT_URL in Vercel env
 * 7. Triggers → Add Trigger → function: autoSync, time-driven, every 5 min
 * 8. Triggers → Add Trigger → function: dailyReport, time-driven, every day 9-10am
 * 9. Triggers → Add Trigger → function: onEdit, event type: On change
 */

const SHEET_ID = '1O2cJqGK2qNAHA9mw2vC4szRtfLshfL0jjmrQicEok6I';
const PROPS = PropertiesService.getScriptProperties();
const DISCORD_WEBHOOK_URL = PROPS.getProperty('DISCORD_WEBHOOK_URL');
const INTERNAL_SECRET = PROPS.getProperty('INTERNAL_SECRET');
const NVIDIA_NIM_API_KEY = PROPS.getProperty('NVIDIA_NIM_API_KEY');
const STRIPE_SECRET_KEY = PROPS.getProperty('STRIPE_SECRET_KEY');

const SHEET_DEFS = [
  {
    name: 'Vendors',
    headers: ['Timestamp', 'TransactionID', 'Status', 'Name', 'BusinessName', 'Email', 'Phone', 'Instagram', 'Category', 'ProfileType', 'Website', 'Tier', 'Amount', 'PaymentMethod', 'StripeSessionID', 'ReceiptURL', 'Notes', 'LastUpdated', 'OfferAmount', 'OfferSubject', 'OfferBody', 'PaymentLinkURL', 'OfferSentAt', 'OfferStatus'],
    statuses: ['Free Profile', 'Pending', 'Offer Sent', 'Paid', 'Confirmed', 'Cancelled', 'Refunded'],
    color: parseInt('0DB8D3', 16),
    widths: [180, 140, 120, 160, 200, 200, 140, 160, 160, 120, 200, 100, 80, 120, 200, 200, 300, 180, 100, 240, 300, 200, 180, 100],
  },
  {
    name: 'Attendees',
    headers: ['Timestamp', 'TransactionID', 'Status', 'Name', 'Email', 'Phone', 'TicketType', 'Amount', 'Referrer', 'StripeSessionID', 'ReceiptURL', 'CheckedIn', 'Notes', 'LastUpdated'],
    statuses: ['Pending', 'Paid', 'Confirmed', 'Checked In', 'Cancelled', 'Refunded'],
    color: '#00a86b',
    widths: [180, 140, 100, 160, 200, 140, 120, 80, 160, 200, 200, 80, 300, 180],
  },
  {
    name: 'Venues',
    headers: ['Timestamp', 'Status', 'VenueName', 'ContactName', 'Email', 'Phone', 'Location', 'City', 'Capacity', 'HasParking', 'HasWiFi', 'IndoorOutdoor', 'Notes', 'ContractURL', 'EventDate', 'LastUpdated'],
    statuses: ['In Review', 'Approved', 'Active', 'Completed', 'Declined'],
    color: '#9b59b6',
    widths: [180, 100, 200, 160, 200, 140, 200, 140, 80, 80, 80, 100, 300, 200, 120, 180],
  },
  {
    name: 'Contacts',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Source', 'Replied', 'Notes', 'LastUpdated'],
    statuses: ['New', 'Read', 'Replied', 'Archived'],
    color: '#e67e22',
    widths: [180, 160, 200, 140, 200, 400, 120, 80, 300, 180],
  },
  {
    name: 'Cities',
    headers: ['Name', 'Status', 'Date', 'Venue', 'Attendees', 'Vendors', 'Notes', 'LastUpdated'],
    statuses: ['Planned', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
    color: '#2ecc71',
    widths: [160, 100, 120, 200, 80, 80, 300, 180],
  },
  {
    name: 'Transactions',
    headers: ['Timestamp', 'TransactionID', 'Type', 'CustomerName', 'CustomerEmail', 'Tier', 'Amount', 'Currency', 'Status', 'StripeSessionID', 'PaymentIntentID', 'ReceiptURL', 'RefundedAmount', 'Notes', 'LastUpdated'],
    statuses: ['Pending', 'Completed', 'Refunded', 'Partial Refund', 'Failed'],
    color: '#f1c40f',
    widths: [180, 140, 100, 160, 200, 100, 80, 80, 100, 200, 200, 200, 100, 300, 180],
  },
  {
    name: 'Analytics',
    headers: ['Date', 'TotalVendors', 'TotalAttendees', 'TotalVenues', 'Revenue', 'NewVendors', 'NewAttendees', 'Notes', 'LastUpdated'],
    statuses: [],
    color: '#3498db',
    widths: [120, 100, 100, 100, 100, 100, 100, 300, 180],
  },
  {
    name: 'Visitors',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Source', 'Page', 'LastUpdated'],
    statuses: [],
    color: '#0DB8D3',
    widths: [180, 160, 200, 140, 120, 200, 180],
  },
  {
    name: 'Newsletter',
    headers: ['Timestamp', 'Email', 'Name', 'Source', 'Status', 'LastUpdated'],
    statuses: ['Subscribed', 'Unsubscribed'],
    color: '#1B7FDC',
    widths: [180, 200, 160, 120, 120, 180],
  },
  {
    name: 'CityRequests',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'City', 'State', 'Country', 'Status', 'Notes', 'LastUpdated'],
    statuses: ['New', 'Evaluating', 'Planned', 'Archived'],
    color: '#0DB8D3',
    widths: [180, 160, 220, 140, 160, 140, 140, 100, 300, 180],
  },
];

/* ═══════════════════════════════════════════
   SETUP — run this once from the editor
   ═══════════════════════════════════════════ */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  SHEET_DEFS.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (sheet) {
      const ui = SpreadsheetApp.getUi();
      const r = ui.alert(`Sheet "${def.name}" already exists. Overwrite it?`, ui.ButtonSet.YES_NO);
      if (r !== ui.Button.YES) return;
      ss.deleteSheet(sheet);
    }
    sheet = ss.insertSheet(def.name);
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
        const lastRow = sheet.getMaxRows();
        if (lastRow > 1) {
          sheet.getRange(2, statusCol, lastRow - 1).setDataValidation(rule);
        }
      }
    }

    Logger.log(`✅ Created sheet: ${def.name}`);
  });

  ss.setActiveSheet(ss.getSheetByName('Vendors'));
  SpreadsheetApp.flush();
  Logger.log('🎉 All sheets created successfully!');
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function sanitize(val, max) {
  if (typeof val !== 'string') val = String(val || '');
  return val.trim().replace(/^[=+\-@]/, "'$&").slice(0, max || 500);
}

function nowISO() { return new Date().toISOString(); }

function getDef(sheetName) {
  return SHEET_DEFS.find(d => d.name === sheetName);
}

function ensureSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  const def = getDef(name);
  sheet = ss.insertSheet(name);
  sheet.setFrozenRows(1);
  if (def) {
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers])
      .setBackground(def.color).setFontColor('#ffffff').setFontWeight('bold');
    if (def.widths) def.widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }
  return sheet;
}

function isAuthorized(data) {
  if (!INTERNAL_SECRET) return false;
  if (data && data._secret === INTERNAL_SECRET) return true;
  return false;
}

function findRowByTID(sheet, tid) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(tid)) return i + 1;
  }
  return -1;
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

/* ═══════════════════════════════════════════
   WEBHOOK HANDLERS
   ═══════════════════════════════════════════ */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.action) return respond({ error: 'Missing action' });
    if (!isAuthorized(data)) {
      notifyDiscord('🚨 Unauthorized Access', `Action: ${data.action}`, 15158332);
      return respond({ error: 'Unauthorized' });
    }
    const ss = SpreadsheetApp.openById(SHEET_ID);

    switch (data.action) {
      case 'submit': return handleSubmit(ss, data);
      case 'updateStatus': return handleUpdateStatus(ss, data);
      case 'processPendingOffers': return handleProcessPendingOffers(ss);
      case 'getCities': return handleGetCities(ss);
      case 'updateCities': return handleUpdateCities(ss, data);
      case 'getVenues': return handleGetVenues(ss);
      case 'updateVenue': return handleUpdateVenue(ss, data);
      case 'getAnalytics': return handleGetAnalytics(ss);
      case 'syncData': return handleSyncData(ss, data);
      case 'health': return respond({ status: 'ok', timestamp: nowISO(), sheet: SHEET_ID });
      default: return respond({ error: 'Unknown action' });
    }
  } catch (err) {
    notifyDiscord('⚠️ System Error', sanitize(err.toString(), 300), 15158332);
    return respond({ error: 'Internal error' });
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const action = e.parameter.action || 'getCities';
    if (action === 'getCities') return handleGetCities(ss);
    if (action === 'getVenues') return handleGetVenues(ss);
    if (action === 'health') return respond({ status: 'ok', timestamp: nowISO() });
    return respond({ error: 'Unknown action' });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/* ─── Action: submit ─── */
function handleSubmit(ss, data) {
  const map = {
    VENDOR: 'Vendors',
    VENUE: 'Venues',
    ATTENDEE: 'Attendees',
    CONTACT: 'Contacts',
    VISITOR: 'Visitors',
    NEWSLETTER: 'Newsletter',
    CITYREQUEST: 'CityRequests',
  };
  const name = map[(data.type || '').toUpperCase()];
  if (!name) return respond({ error: 'Invalid type' });

  const sheet = ensureSheet(ss, name);
  const tid = sanitize(data.transactionID || 'TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase(), 50);
  sheet.appendRow(buildRow(data.type.toUpperCase(), data, tid));

  // ─── CITY REQUEST DISCORD ALERT ───
  if ((data.type || '').toUpperCase() === 'CITYREQUEST') {
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
    `**Name:** ${sanitize(data.name, 50)}\n**Email:** ${(data.email || 'N/A').slice(0, 3)}***\n**ID:** ${tid}`, 3447003);

  // ─── VENDOR WORKFLOW ───
  if ((data.type || '').toUpperCase() === 'VENDOR' && data.email) {
    const isFree = !data.tier || data.tier.toLowerCase() === 'free';

    if (isFree) {
      // Free profile intake — send welcome email
      sendEmail('VENDOR_FREE', {
        email: data.email,
        name: data.name || 'Vendor',
        business: data.businessName || '',
        category: data.category || 'General',
        tid: tid,
      });
      return respond({ success: true, transactionID: tid });
    }

    // High-Ticket Booth Application Pipeline with double-send guard
    try {
      const rowIdx = findRowByTID(sheet, tid);
      processVendorOffer(ss, sheet, rowIdx, data, tid);
    } catch (offerErr) {
      console.error('Offer pipeline error:', offerErr.toString());
      notifyDiscord('⚠️ Offer Pipeline Error',
        `**Vendor:** ${sanitize(data.name, 50)}\n**Error:** ${sanitize(offerErr.toString(), 200)}`,
        15158332);
    }
  }

  return respond({ success: true, transactionID: tid });
}

/**
 * Generates and records custom AI vendor offer.
 * IDEMPOTENCY: Checks OfferStatus and OfferSentAt so AI NEVER double-sends.
 */
function processVendorOffer(ss, sheet, rowIdx, data, tid) {
  const colMap = getColMap(sheet);

  // Anti-Double-Send Guard: Check if offer has already been sent
  if (rowIdx > 0) {
    const currentOfferStatus = colMap['OfferStatus'] ? String(sheet.getRange(rowIdx, colMap['OfferStatus']).getValue() || '').trim() : '';
    const currentOfferSentAt = colMap['OfferSentAt'] ? String(sheet.getRange(rowIdx, colMap['OfferSentAt']).getValue() || '').trim() : '';
    if (currentOfferStatus.toLowerCase() === 'sent' || currentOfferSentAt) {
      Logger.log(`ℹ️ Offer already marked as sent for ${tid} at ${currentOfferSentAt}. Skipping to prevent double-send.`);
      return { skipped: true, reason: 'Already sent' };
    }
  }

  const offer = generateCustomOffer(data);
  const paymentLink = createStripePaymentLink(
    offer.amount,
    'MARKETPEACE Vendor Registration — ' + (offer.boothRecommendation || data.tier || 'Standard'),
    { transactionID: tid, type: 'Vendor', tier: data.tier || 'Standard' }
  );

  const subject = sanitize(data.name, 50) + ', your custom MARKETPEACE offer is ready — $' + offer.amount;
  const sent = sendOfferEmail(data, offer, paymentLink, tid, subject);

  // Record all details into dedicated sheet columns
  if (rowIdx > 0) {
    if (colMap['OfferAmount']) sheet.getRange(rowIdx, colMap['OfferAmount']).setValue(offer.amount);
    if (colMap['OfferSubject']) sheet.getRange(rowIdx, colMap['OfferSubject']).setValue(sanitize(subject, 200));
    if (colMap['OfferBody']) sheet.getRange(rowIdx, colMap['OfferBody']).setValue(sanitize(offer.proposal, 2000));
    if (colMap['PaymentLinkURL']) sheet.getRange(rowIdx, colMap['PaymentLinkURL']).setValue(paymentLink);
    if (colMap['OfferSentAt']) sheet.getRange(rowIdx, colMap['OfferSentAt']).setValue(nowISO());
    if (colMap['OfferStatus']) sheet.getRange(rowIdx, colMap['OfferStatus']).setValue('Sent');
    if (colMap['Status']) sheet.getRange(rowIdx, colMap['Status']).setValue('Offer Sent');
    if (colMap['LastUpdated']) sheet.getRange(rowIdx, colMap['LastUpdated']).setValue(nowISO());
  }

  notifyDiscord('🤖 AI Offer Generated & Sent',
    `**Vendor:** ${sanitize(data.businessName || data.name, 50)}\n**Amount:** $${offer.amount}\n**Subject:** ${sanitize(subject, 100)}\n**Status:** Sent\n**ID:** ${tid.slice(0, 8)}***`,
    3066993);

  return { success: true, amount: offer.amount, paymentLink: paymentLink, subject: subject };
}

/* ─── Action: processPendingOffers (Batch / Cron safe processor) ─── */
function handleProcessPendingOffers(ss) {
  const sheet = ensureSheet(ss, 'Vendors');
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return respond({ processed: 0 });

  const colMap = getColMap(sheet);
  let count = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowIdx = i + 1;
    const r = rows[i];
    const tid = colMap['TransactionID'] ? String(r[colMap['TransactionID'] - 1] || '') : '';
    const status = colMap['Status'] ? String(r[colMap['Status'] - 1] || '') : '';
    const tier = colMap['Tier'] ? String(r[colMap['Tier'] - 1] || '') : '';
    const offerStatus = colMap['OfferStatus'] ? String(r[colMap['OfferStatus'] - 1] || '') : '';
    const offerSentAt = colMap['OfferSentAt'] ? String(r[colMap['OfferSentAt'] - 1] || '') : '';
    const email = colMap['Email'] ? String(r[colMap['Email'] - 1] || '') : '';
    const name = colMap['Name'] ? String(r[colMap['Name'] - 1] || '') : '';
    const businessName = colMap['BusinessName'] ? String(r[colMap['BusinessName'] - 1] || '') : '';
    const instagram = colMap['Instagram'] ? String(r[colMap['Instagram'] - 1] || '') : '';

    const isHighTicket = tier.toLowerCase() === 'standard' || tier.toLowerCase() === 'flagship';
    const isPending = status.toLowerCase() === 'pending' || status === '';
    const notSent = offerStatus.toLowerCase() !== 'sent' && !offerSentAt;

    if (isHighTicket && isPending && notSent && email) {
      const vendorData = {
        name: name,
        businessName: businessName,
        email: email,
        instagram: instagram,
        tier: tier,
      };
      processVendorOffer(ss, sheet, rowIdx, vendorData, tid);
      count++;
    }
  }

  return respond({ success: true, processed: count });
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

  const paid = data.status === 'Paid' || data.status === 'Confirmed';
  notifyDiscord(paid ? '💰 Payment Received' : '🔄 Status Update',
    `**Type:** ${data.type}\n**ID:** ${tid.slice(0, 8)}***\n**Status:** ${data.status}`,
    paid ? 3066993 : 15105570);

  if (paid && data.email) {
    sendEmail(data.type.toUpperCase(), {
      email: data.email, name: data.name || 'Valued Guest',
      tid, business: data.businessName || '', ticketType: data.ticketType || 'General',
    });
  }

  return respond({ success: true });
}

/* ─── Action: getCities ─── */
function handleGetCities(ss) {
  const sheet = ss.getSheetByName('Cities');
  if (!sheet || sheet.getLastRow() < 2) return respond([]);
  const rows = sheet.getDataRange().getValues();
  const cities = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) cities.push({ name: String(rows[i][0]), status: String(rows[i][1] || 'Planned'), date: String(rows[i][2] || ''), venue: String(rows[i][3] || '') });
  }
  return respond(cities);
}

/* ─── Action: updateCities ─── */
function handleUpdateCities(ss, data) {
  if (!Array.isArray(data.cities)) return respond({ error: 'Invalid format' });
  const sheet = ensureSheet(ss, 'Cities');
  sheet.clearContents();
  const def = getDef('Cities');
  sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
  data.cities.forEach(c => sheet.appendRow([
    sanitize(c.name, 100), sanitize(c.status || 'Planned', 50), sanitize(c.date, 50),
    sanitize(c.venue, 150), '', '', '', nowISO(),
  ]));
  notifyDiscord('🌍 Cities Synced', `${data.cities.length} cities updated`, 3447003);
  return respond({ success: true, count: data.cities.length });
}

/* ─── Action: getVenues ─── */
function handleGetVenues(ss) {
  const sheet = ss.getSheetByName('Venues');
  if (!sheet || sheet.getLastRow() < 2) return respond([]);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const venues = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[0]) {
      venues.push({
        timestamp: String(r[0] || ''),
        status: String(r[1] || ''),
        venueName: String(r[2] || ''),
        contactName: String(r[3] || ''),
        email: String(r[4] || ''),
        phone: String(r[5] || ''),
        location: String(r[6] || ''),
        city: String(r[7] || ''),
        capacity: String(r[8] || ''),
        hasParking: String(r[9] || ''),
        hasWiFi: String(r[10] || ''),
        indoorOutdoor: String(r[11] || ''),
        notes: String(r[12] || ''),
        contractURL: String(r[13] || ''),
        eventDate: String(r[14] || ''),
        lastUpdated: String(r[15] || ''),
      });
    }
  }
  return respond(venues);
}

/* ─── Action: updateVenue (sync from site back to sheet) ─── */
function handleUpdateVenue(ss, data) {
  const sheet = ensureSheet(ss, 'Venues');
  const rows = sheet.getDataRange().getValues();
  const def = getDef('Venues');
  // Try to find existing venue by VenueName
  let found = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2] || '').toLowerCase() === String(data.venueName || '').toLowerCase()) {
      found = i;
      break;
    }
  }
  const venue = data.venue || {};
  const row = [
    nowISO(),
    sanitize(venue.status || (found >= 0 ? String(rows[found][1]) : 'In Review'), 50),
    sanitize(venue.venueName || data.venueName || '', 150),
    sanitize(venue.contactName || '', 100),
    sanitize(venue.email || '', 254),
    sanitize(venue.phone || '', 20),
    sanitize(venue.location || '', 200),
    sanitize(venue.city || '', 100),
    sanitize(venue.capacity || '', 20),
    sanitize(venue.hasParking || '', 10),
    sanitize(venue.hasWiFi || '', 10),
    sanitize(venue.indoorOutdoor || '', 20),
    sanitize(venue.notes || '', 1000),
    sanitize(venue.contractURL || '', 200),
    sanitize(venue.eventDate || '', 50),
    nowISO(),
  ];
  if (found >= 0) {
    // Update existing row
    sheet.getRange(found + 1, 1, 1, row.length).setValues([row]);
    return respond({ success: true, action: 'updated', row: found + 1 });
  } else {
    // Append new row
    sheet.appendRow(row);
    return respond({ success: true, action: 'created' });
  }
}

/* ─── Action: getAnalytics ─── */
function handleGetAnalytics(ss) {
  const stats = {};
  SHEET_DEFS.forEach(def => {
    const s = ss.getSheetByName(def.name);
    stats[def.name] = s ? Math.max(0, s.getLastRow() - 1) : 0;
  });
  let revenue = 0;
  const tSheet = ss.getSheetByName('Transactions');
  if (tSheet && tSheet.getLastRow() > 1) {
    const rows = tSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][8] || '') === 'Completed') revenue += parseFloat(rows[i][6]) || 0;
    }
  }
  stats.Revenue = revenue;
  return respond(stats);
}

/* ─── Action: syncData (admin panel) ─── */
function handleSyncData(ss, data) {
  if (!data.sheet || !Array.isArray(data.rows)) return respond({ error: 'Invalid format' });
  const sheet = ensureSheet(ss, data.sheet);
  sheet.clearContents();
  const def = getDef(data.sheet);
  if (def) sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
  data.rows.forEach(r => sheet.appendRow(r.map(v => sanitize(v, 500))));
  return respond({ success: true, count: data.rows.length });
}

/* ═══════════════════════════════════════════
   ROW BUILDER
   ═══════════════════════════════════════════ */
function buildRow(type, data, tid) {
  const s = (v, m) => sanitize(v, m);
  const ts = nowISO();
  switch (type) {
    case 'VENDOR':
      return [
        ts,
        tid,
        s(data.status || (data.tier === 'Free' ? 'Free Profile' : 'Pending'), 50),
        s(data.name, 100),
        s(data.businessName, 150),
        s(data.email, 254),
        s(data.phone, 20),
        s(data.instagram, 100),
        s(data.category || 'General', 100),
        s(data.tier === 'Free' ? 'Free' : 'High-Ticket Lead', 50),
        s(data.website, 200),
        s(data.tier || 'Free', 20),
        s(data.amount || '0', 20),
        s(data.paymentMethod || 'free', 20),
        '', '', '', ts,
        '', '', '', '', '', (data.tier === 'Free' ? 'N/A' : 'Pending'),
      ];
    case 'ATTENDEE':
      return [ts, tid, s(data.status || 'Registered', 50), s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.ticketType || 'Free', 30), s(data.amount || '0', 20), s(data.referrer, 100), '', '', 'No', '', ts];
    case 'CITYREQUEST':
      return [ts, s(data.name, 100), s(data.email, 254), s(data.phone, 30), s(data.city, 100), s(data.state, 100), s(data.country, 100), 'New', '', ts];
    case 'VENUE':
      return [ts, 'In Review', s(data.venueName, 150), s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.location, 200), s(data.city, 100), s(data.capacity, 20), s(data.hasParking, 10), s(data.hasWiFi, 10), s(data.indoorOutdoor, 20), s(data.notes, 1000), '', s(data.eventDate, 50), ts];
    case 'CONTACT':
      return [ts, s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.subject, 200), s(data.message, 2000), s(data.source, 50), 'No', '', ts];
    case 'VISITOR':
      return [ts, s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.source, 50), s(data.page, 200), ts];
    case 'NEWSLETTER':
      return [ts, s(data.email, 254), s(data.name, 100), s(data.source, 50), s(data.status || 'Subscribed', 50), ts];
    default:
      return [ts, tid, 'Unknown'];
  }
}

function lastColIdx(name) {
  const def = getDef(name);
  return def ? def.headers.length : 16;
}

/* ═══════════════════════════════════════════
   EMAIL
   ═══════════════════════════════════════════ */
function sendEmail(type, d) {
  if (!d.email) return;
  const templates = {
    VENDOR_FREE: {
      subject: "Welcome to MARKETPEACE! Your Free Vendor Profile is Live",
      body: [
        'Hi {NAME},',
        '',
        'Welcome to MARKETPEACE! Your vendor profile for {BUSINESS} has been created.',
        '',
        '── Profile Info ──',
        'Business: {BUSINESS}',
        'Category: {CATEGORY}',
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
    },
    VENDOR: {
      subject: "You're In! Your Vendor Spot is Confirmed at MARKETPEACE",
      body: [
        'Hi {NAME},',
        '',
        'Your vendor spot at MARKETPEACE is confirmed and paid!',
        '',
        '── Confirmation ──',
        'Business: {BUSINESS}',
        'Transaction: {TID}',
        '',
        '── What Happens Next ──',
        "In 3-5 days you'll receive:",
        "• Event timeline & load-in instructions",
        "• Promotional materials featuring your brand",
        "• Social media schedule & vendor spotlight details",
        '',
        'Questions? foreignaffairsllc2017@gmail.com',
        '',
        '— The MARKETPEACE Team',
      ].join('\n'),
    },
    ATTENDEE: {
      subject: 'Your MARKETPEACE Ticket is Confirmed!',
      body: [
        'Hey {NAME}!',
        '',
        "You're all set — your ticket to MARKETPEACE is confirmed.",
        '',
        '── Ticket Info ──',
        'Type: {TICKET_TYPE}',
        'Transaction: {TID}',
        '',
        '── Event Day ──',
        'Show this email at the door for entry.',
        'First 100 guests get exclusive goodie bags.',
        '',
        'Questions? foreignaffairsllc2017@gmail.com',
        '',
        '— The MARKETPEACE Team',
      ].join('\n'),
    },
  };
  const tpl = templates[type];
  if (!tpl) return;
  try {
    MailApp.sendEmail({
      to: d.email,
      subject: tpl.subject,
      body: tpl.body.replace(/{NAME}/g, sanitize(d.name, 100)).replace(/{TID}/g, sanitize(d.tid, 50)).replace(/{BUSINESS}/g, sanitize(d.business, 150)).replace(/{TICKET_TYPE}/g, sanitize(d.ticketType, 30)),
      name: 'MARKETPEACE',
    });
  } catch (e) { console.error('Email failed:', e.toString()); }
}

/* ═══════════════════════════════════════════
   AI OFFER GENERATION — NVIDIA NIM
   ═══════════════════════════════════════════ */

/**
 * Calls NVIDIA NIM API (OpenAI-compatible) to generate a custom vendor offer.
 * Returns { amount, proposal, perks, boothRecommendation }
 */
function generateCustomOffer(data) {
  if (!NVIDIA_NIM_API_KEY) {
    console.warn('NVIDIA_NIM_API_KEY not set — using fallback pricing');
    return fallbackOffer(data);
  }

  const tierBase = { Standard: 250, Flagship: 500 };
  const preferredTier = data.tier || 'Standard';
  const baseAmount = tierBase[preferredTier] || 250;

  const systemPrompt = [
    'You are a MARKETPEACE vendor offer specialist.',
    'MARKETPEACE is a vendor-event marketplace connecting small businesses, venues, and communities.',
    'Standard tier: $250 (6ft table, standard placement). Flagship tier: $500 (premium corner, featured promotion).',
    'Based on the vendor application below, generate a personalized offer.',
    'You may adjust pricing within ±20% of the base tier price to reward strong applications or add value.',
    'Return ONLY valid JSON with these keys:',
    '  amount (number): final offer price in USD (integer, no cents)',
    '  proposal (string): 2-3 sentence personalized offer message addressing the vendor by name',
    '  perks (array of strings): 3-5 perks included in this offer',
    '  boothRecommendation (string): either "Standard" or "Flagship"',
  ].join('\n');

  const userPrompt = [
    'Vendor Application:',
    '  Name: ' + sanitize(data.name, 100),
    '  Business: ' + sanitize(data.businessName, 150),
    '  Instagram: ' + sanitize(data.instagram, 100),
    '  Preferred Tier: ' + preferredTier,
    '  Base Price: $' + baseAmount,
  ].join('\n');

  try {
    const response = UrlFetchApp.fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + NVIDIA_NIM_API_KEY },
      payload: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
      muteHttpExceptions: true,
    });

    const status = response.getResponseCode();
    if (status !== 200) {
      console.error('NIM API error: HTTP ' + status + ' — ' + response.getContentText().slice(0, 200));
      return fallbackOffer(data);
    }

    const result = JSON.parse(response.getContentText());
    const content = result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
    if (!content) return fallbackOffer(data);

    const offer = JSON.parse(content);

    // Validate and clamp the amount
    const amount = Math.round(Number(offer.amount) || baseAmount);
    const minAmount = Math.round(baseAmount * 0.8);
    const maxAmount = Math.round(baseAmount * 1.2);
    const clampedAmount = Math.max(minAmount, Math.min(maxAmount, amount));

    return {
      amount: clampedAmount,
      proposal: sanitize(offer.proposal || ('Welcome to MARKETPEACE, ' + sanitize(data.name, 50) + '!'), 1000),
      perks: Array.isArray(offer.perks) ? offer.perks.map(p => sanitize(String(p), 200)).slice(0, 6) : defaultPerks(preferredTier),
      boothRecommendation: (offer.boothRecommendation === 'Flagship' || offer.boothRecommendation === 'Standard') ? offer.boothRecommendation : preferredTier,
    };
  } catch (err) {
    console.error('NIM API call failed:', err.toString());
    return fallbackOffer(data);
  }
}

function fallbackOffer(data) {
  const tier = data.tier || 'Standard';
  const amount = tier === 'Flagship' ? 500 : 250;
  return {
    amount: amount,
    proposal: 'Welcome to MARKETPEACE, ' + sanitize(data.name, 50) + '! Your ' + tier + ' vendor booth is ready — secure your spot today.',
    perks: defaultPerks(tier),
    boothRecommendation: tier,
  };
}

function defaultPerks(tier) {
  const base = ['Event listing inclusion', 'Social media mention', 'Post-event photo content', 'Vendor directory listing'];
  if (tier === 'Flagship') {
    return ['Premium corner placement', 'Featured on all promotions', 'Social media shoutout', 'VIP platform listing', 'Priority email blasts'];
  }
  return base;
}

/* ═══════════════════════════════════════════
   STRIPE PAYMENT LINK CREATION
   ═══════════════════════════════════════════ */

/**
 * Creates a Stripe Payment Link with a custom amount.
 * Uses Stripe API directly via UrlFetchApp.
 * Returns the payment link URL string.
 */
function createStripePaymentLink(amount, description, metadata) {
  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set — cannot create payment link');
    return '';
  }

  const amountCents = Math.round(amount * 100);
  const stripeAuth = { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY };

  try {
    // Step 1: Create a one-time Price
    const priceResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/prices', {
      method: 'post',
      headers: stripeAuth,
      payload: {
        'unit_amount': String(amountCents),
        'currency': 'usd',
        'product_data[name]': sanitize(description, 200),
      },
      muteHttpExceptions: true,
    });

    if (priceResponse.getResponseCode() !== 200) {
      console.error('Stripe Price creation failed: ' + priceResponse.getContentText().slice(0, 300));
      return '';
    }

    const price = JSON.parse(priceResponse.getContentText());

    // Step 2: Create a Payment Link for that Price
    const linkPayload = {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
    };
    // Add metadata
    if (metadata) {
      Object.keys(metadata).forEach(function (key) {
        linkPayload['metadata[' + key + ']'] = sanitize(String(metadata[key]), 100);
      });
    }

    const linkResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_links', {
      method: 'post',
      headers: stripeAuth,
      payload: linkPayload,
      muteHttpExceptions: true,
    });

    if (linkResponse.getResponseCode() !== 200) {
      console.error('Stripe Payment Link creation failed: ' + linkResponse.getContentText().slice(0, 300));
      return '';
    }

    const link = JSON.parse(linkResponse.getContentText());
    return link.url || '';
  } catch (err) {
    console.error('Stripe API error:', err.toString());
    return '';
  }
}

/* ═══════════════════════════════════════════
   OFFER EMAIL — HTML template
   ═══════════════════════════════════════════ */

/**
 * Sends a branded HTML email with the AI-generated offer and Stripe Payment Link.
 */
function sendOfferEmail(data, offer, paymentLink, tid, customSubject) {
  if (!data.email) return false;

  const perksHtml = (offer.perks || []).map(function (p) {
    return '<li style="padding:4px 0;color:#d1d5db;font-size:14px;">✓ ' + sanitize(p, 200) + '</li>';
  }).join('');

  const htmlBody = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background-color:#0f1b24;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="max-width:600px;margin:0 auto;padding:40px 20px;">',
    '',
    '  <!-- Header -->',
    '  <div style="text-align:center;margin-bottom:32px;">',
    '    <h1 style="color:#0DB8D3;font-size:28px;letter-spacing:8px;margin:0;">MARKETPEACE</h1>',
    '    <p style="color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:8px;">THE INFRASTRUCTURE OF INDEPENDENCE</p>',
    '  </div>',
    '',
    '  <!-- Offer Card -->',
    '  <div style="background:#193546;border:1px solid rgba(13,184,211,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">',
    '    <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Your Custom Offer</p>',
    '    <h2 style="color:#ffffff;font-size:24px;margin:0 0 16px 0;">Hey ' + sanitize(data.name, 50) + ',</h2>',
    '    <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 24px 0;">' + sanitize(offer.proposal, 1000) + '</p>',
    '',
    '    <!-- Price -->',
    '    <div style="background:rgba(13,184,211,0.1);border:1px solid rgba(13,184,211,0.2);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">',
    '      <p style="color:#0DB8D3;font-size:11px;letter-spacing:3px;margin:0 0 4px 0;">YOUR PRICE</p>',
    '      <p style="color:#ffffff;font-size:36px;font-weight:bold;margin:0;">$' + offer.amount + '</p>',
    '      <p style="color:#6b7280;font-size:12px;margin:4px 0 0 0;">' + sanitize(offer.boothRecommendation, 20) + ' Booth</p>',
    '    </div>',
    '',
    '    <!-- Perks -->',
    '    <p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0 0 12px 0;letter-spacing:1px;">WHAT\'S INCLUDED:</p>',
    '    <ul style="list-style:none;padding:0;margin:0 0 24px 0;">' + perksHtml + '</ul>',
    '',
    '    <!-- CTA Button -->',
    paymentLink ? [
      '    <div style="text-align:center;">',
      '      <a href="' + paymentLink + '" style="display:inline-block;background:#0DB8D3;color:#0f1b24;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;padding:16px 40px;border-radius:12px;">SECURE YOUR SPOT →</a>',
      '    </div>',
    ].join('\n') : '<p style="color:#fbbf24;font-size:13px;">Payment link is being generated. You\'ll receive a follow-up email shortly.</p>',
    '  </div>',
    '',
    '  <!-- Footer -->',
    '  <div style="text-align:center;padding:20px 0;">',
    '    <p style="color:#6b7280;font-size:11px;margin:0 0 4px 0;">Transaction ID: ' + sanitize(tid, 50) + '</p>',
    '    <p style="color:#6b7280;font-size:11px;margin:0 0 4px 0;">Questions? Reply to this email or contact foreignaffairsllc2017@gmail.com</p>',
    '    <p style="color:#4b5563;font-size:10px;margin:12px 0 0 0;">© 2026 MARKETPEACE. All rights reserved.</p>',
    '  </div>',
    '',
    '</div>',
    '</body></html>',
  ].join('\n');

  const plainText = [
    'MARKETPEACE — Your Custom Vendor Offer',
    '',
    'Hey ' + sanitize(data.name, 50) + ',',
    '',
    offer.proposal,
    '',
    'Your Price: $' + offer.amount + ' (' + offer.boothRecommendation + ' Booth)',
    '',
    'What\'s included:',
    (offer.perks || []).map(function (p) { return '  ✓ ' + p; }).join('\n'),
    '',
    paymentLink ? 'Secure your spot: ' + paymentLink : 'Payment link will be sent shortly.',
    '',
    'Transaction ID: ' + tid,
    'Questions? foreignaffairsllc2017@gmail.com',
    '',
    '— The MARKETPEACE Team',
  ].join('\n');

  const emailSubject = customSubject || (sanitize(data.name, 50) + ', your custom MARKETPEACE offer is ready — $' + offer.amount);

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

/* ═══════════════════════════════════════════
   DISCORD
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
  } catch (e) { console.error('Discord error:', e.toString()); }
}

/* ═══════════════════════════════════════════
   REAL-TIME SYNC — onEdit sends venue changes to Vercel
   ═══════════════════════════════════════════ */
function onEdit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  if (sheetName !== 'Venues') return;
  if (e.range.getRow() < 2) return;

  const row = sheet.getRange(e.range.getRow(), 1, 1, 16).getValues()[0];
  const payload = {
    timestamp: String(row[0] || ''),
    status: String(row[1] || ''),
    venueName: String(row[2] || ''),
    contactName: String(row[3] || ''),
    email: String(row[4] || ''),
    phone: String(row[5] || ''),
    location: String(row[6] || ''),
    city: String(row[7] || ''),
    capacity: String(row[8] || ''),
    hasParking: String(row[9] || ''),
    hasWiFi: String(row[10] || ''),
    indoorOutdoor: String(row[11] || ''),
    notes: String(row[12] || ''),
    contractURL: String(row[13] || ''),
    eventDate: String(row[14] || ''),
    lastUpdated: String(row[15] || ''),
  };

  const WEBHOOK_URL = PROPS.getProperty('VENUE_WEBHOOK_URL');
  if (!WEBHOOK_URL) return;

  try {
    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ _secret: INTERNAL_SECRET, venue: payload, action: 'venueUpdated' }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    console.error('onEdit webhook failed:', err.toString());
  }
}

/* ═══════════════════════════════════════════
   CRON TRIGGERS & AUTOMATION
   ═══════════════════════════════════════════ */

/**
 * Scheduled trigger function: processes any pending high-ticket offers
 * with strict idempotency (guaranteed no double-sending).
 */
function processPendingOffers() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  handleProcessPendingOffers(ss);
}

function autoSync() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let stats = '';
  SHEET_DEFS.forEach(def => {
    const s = ss.getSheetByName(def.name);
    stats += `**${def.name}:** ${s ? Math.max(0, s.getLastRow() - 1) : 0}\n`;
  });
  const min = new Date().getMinutes();
  if (min < 5) {
    notifyDiscord('📡 System Health Pulse', `All systems operational.\n\n${stats}`, 3447003);
  }
}

function dailyReport() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let body = '📊 **MARKETPEACE Daily Report**\n\n';
  SHEET_DEFS.forEach(def => {
    const s = ss.getSheetByName(def.name);
    const count = s ? Math.max(0, s.getLastRow() - 1) : 0;
    body += `**${def.name}:** ${count}\n`;
  });
  let revenue = 0;
  const tSheet = ss.getSheetByName('Transactions');
  if (tSheet && tSheet.getLastRow() > 1) {
    const rows = tSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][8] || '') === 'Completed') revenue += parseFloat(rows[i][6]) || 0;
    }
  }
  body += `\n**Total Revenue:** $${revenue.toFixed(2)}`;
  notifyDiscord('📊 Daily Report', body, 3447003);
}

/* ═══════════════════════════════════════════
   RESPONSE
   ═══════════════════════════════════════════ */
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

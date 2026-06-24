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
 * 5. Deploy → New Deployment → Web app → Execute as: Me → Anyone
 * 6. Copy the deployment URL → set as GOOGLE_SCRIPT_URL in Vercel env
 * 7. Triggers → Add Trigger → function: autoSync, time-driven, every 5 min
 * 8. Triggers → Add Trigger → function: dailyReport, time-driven, every day 9-10am
 */

const SHEET_ID = '1U4OAHwkntuIlcgWUbtAFJ2R0hBkyTqSJHtmmzsjEa1g';
const PROPS = PropertiesService.getScriptProperties();
const DISCORD_WEBHOOK_URL = PROPS.getProperty('DISCORD_WEBHOOK_URL');
const INTERNAL_SECRET = PROPS.getProperty('INTERNAL_SECRET');

/* ─── Sheet Definitions ─── */
const SHEET_DEFS = [
  {
    name: 'Vendors',
    headers: ['Timestamp', 'TransactionID', 'Status', 'Name', 'BusinessName', 'Email', 'Phone', 'Instagram', 'Website', 'Tier', 'Amount', 'PaymentMethod', 'StripeSessionID', 'ReceiptURL', 'Notes', 'LastUpdated'],
    statuses: ['Pending', 'Paid', 'Confirmed', 'Cancelled', 'Refunded'],
    color: '#0077b6',
    widths: [180, 140, 100, 160, 200, 200, 140, 160, 200, 100, 80, 120, 200, 200, 300, 180],
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
];

/* ═══════════════════════════════════════════
   SETUP — run this once from the editor
   ═══════════════════════════════════════════ */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  SHEET_DEFS.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (sheet) {
      const r = confirm(`Sheet "${def.name}" already exists. Overwrite it? Click Cancel to skip.`);
      if (!r) return;
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
      case 'submit':        return handleSubmit(ss, data);
      case 'updateStatus':  return handleUpdateStatus(ss, data);
      case 'getCities':     return handleGetCities(ss);
      case 'updateCities':  return handleUpdateCities(ss, data);
      case 'getVenues':     return handleGetVenues(ss);
      case 'getAnalytics':  return handleGetAnalytics(ss);
      case 'syncData':      return handleSyncData(ss, data);
      case 'health':        return respond({ status: 'ok', timestamp: nowISO(), sheet: SHEET_ID });
      default:              return respond({ error: 'Unknown action' });
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
  const map = { VENDOR: 'Vendors', VENUE: 'Venues', ATTENDEE: 'Attendees', CONTACT: 'Contacts' };
  const name = map[(data.type || '').toUpperCase()];
  if (!name) return respond({ error: 'Invalid type' });

  const sheet = ensureSheet(ss, name);
  const tid = sanitize(data.transactionID || 'TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase(), 50);
  sheet.appendRow(buildRow(data.type.toUpperCase(), data, tid));

  notifyDiscord('📝 New ' + data.type,
    `**Name:** ${sanitize(data.name, 50)}\n**Email:** ${(data.email || 'N/A').slice(0, 3)}***\n**ID:** ${tid}`, 3447003);

  return respond({ success: true, transactionID: tid });
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

  const statusCol = 3;
  sheet.getRange(rowIdx, statusCol).setValue(sanitize(data.status, 50));
  sheet.getRange(rowIdx, lastColIdx(name)).setValue(nowISO());

  const receiptCol = name === 'Vendors' ? 14 : 11;
  if (data.receiptURL) sheet.getRange(rowIdx, receiptCol).setValue(sanitize(data.receiptURL, 500));
  const sessionCol = name === 'Vendors' ? 13 : 10;
  if (data.stripeSessionID) sheet.getRange(rowIdx, sessionCol).setValue(sanitize(data.stripeSessionID, 100));

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
  const venues = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && String(rows[i][1]) === 'Approved') {
      venues.push({ name: String(rows[i][2] || ''), location: String(rows[i][6] || ''), city: String(rows[i][7] || ''), capacity: String(rows[i][8] || '') });
    }
  }
  return respond(venues);
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
      return [ts, tid, 'Pending', s(data.name, 100), s(data.businessName, 150), s(data.email, 254), s(data.phone, 20), s(data.instagram, 100), s(data.website, 200), s(data.tier, 20), s(data.amount, 20), s(data.paymentMethod, 20), '', '', '', ts];
    case 'ATTENDEE':
      return [ts, tid, 'Pending', s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.ticketType, 30), s(data.amount, 20), s(data.referrer, 100), '', '', 'No', '', ts];
    case 'VENUE':
      return [ts, 'In Review', s(data.venueName, 150), s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.location, 200), s(data.city, 100), s(data.capacity, 20), s(data.hasParking, 10), s(data.hasWiFi, 10), s(data.indoorOutdoor, 20), s(data.notes, 1000), '', s(data.eventDate, 50), ts];
    case 'CONTACT':
      return [ts, s(data.name, 100), s(data.email, 254), s(data.phone, 20), s(data.subject, 200), s(data.message, 2000), s(data.source, 50), 'No', '', ts];
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
        'Questions? contact@foreignaffairsmarket.com',
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
        'Questions? contact@foreignaffairsmarket.com',
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
   AUTO SYNC & REPORTING
   ═══════════════════════════════════════════ */
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

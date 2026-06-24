/**
 * MARKETPEACE — Google Apps Script Backend v2
 *
 * Multi-sheet real-time sync engine.
 * Auto-creates all tabs, syncs submissions, handles webhooks,
 * sends Discord notifications + email confirmations.
 *
 * DEPLOYMENT:
 * 1. Create Google Apps Script project
 * 2. Project Settings → Script Properties → Add:
 *    - SHEET_ID: Your Google Spreadsheet ID
 *    - DISCORD_WEBHOOK_URL: Discord webhook URL
 *    - INTERNAL_SECRET: Strong random string (same as Vercel INTERNAL_WEBHOOK_SECRET)
 * 3. Deploy → New Deployment → Web app → Execute as: Me → Anyone
 * 4. Set GOOGLE_SCRIPT_URL in Vercel env to the deployment URL
 * 5. Set a time-based trigger for autoSync (every 5 min)
 */

const PROPS = PropertiesService.getScriptProperties();
const SHEET_ID = PROPS.getProperty('SHEET_ID');
const DISCORD_WEBHOOK_URL = PROPS.getProperty('DISCORD_WEBHOOK_URL');
const INTERNAL_SECRET = PROPS.getProperty('INTERNAL_SECRET');

/* ─── All Sheets ─── */
const SHEET_DEFS = {
  Vendors: {
    headers: [
      'Timestamp', 'TransactionID', 'Status', 'Name', 'BusinessName', 'Email',
      'Phone', 'Instagram', 'Website', 'Tier', 'Amount', 'PaymentMethod',
      'StripeSessionID', 'ReceiptURL', 'Notes', 'LastUpdated'
    ],
    statuses: ['Pending', 'Paid', 'Confirmed', 'Cancelled', 'Refunded'],
    color: '#0077b6',
  },
  Attendees: {
    headers: [
      'Timestamp', 'TransactionID', 'Status', 'Name', 'Email', 'Phone',
      'TicketType', 'Amount', 'Referrer', 'StripeSessionID', 'ReceiptURL',
      'CheckedIn', 'Notes', 'LastUpdated'
    ],
    statuses: ['Pending', 'Paid', 'Confirmed', 'Checked In', 'Cancelled', 'Refunded'],
    color: '#00a86b',
  },
  Venues: {
    headers: [
      'Timestamp', 'Status', 'VenueName', 'ContactName', 'Email', 'Phone',
      'Location', 'City', 'Capacity', 'HasParking', 'Has WiFi',
      'IndoorOutdoor', 'Notes', 'ContractURL', 'EventDate', 'LastUpdated'
    ],
    statuses: ['In Review', 'Approved', 'Active', 'Completed', 'Declined'],
    color: '#9b59b6',
  },
  Contacts: {
    headers: [
      'Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message',
      'Source', 'Replied', 'Notes', 'LastUpdated'
    ],
    statuses: ['New', 'Read', 'Replied', 'Archived'],
    color: '#e67e22',
  },
  Cities: {
    headers: ['Name', 'Status', 'Date', 'Venue', 'Attendees', 'Vendors', 'Notes', 'LastUpdated'],
    statuses: ['Planned', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
    color: '#2ecc71',
  },
  Transactions: {
    headers: [
      'Timestamp', 'TransactionID', 'Type', 'CustomerName', 'CustomerEmail',
      'Tier', 'Amount', 'Currency', 'Status', 'StripeSessionID',
      'PaymentIntentID', 'ReceiptURL', 'RefundedAmount', 'Notes', 'LastUpdated'
    ],
    statuses: ['Pending', 'Completed', 'Refunded', 'Partial Refund', 'Failed'],
    color: '#f1c40f',
  },
  Analytics: {
    headers: [
      'Date', 'TotalVendors', 'TotalAttendees', 'TotalVenues', 'Revenue',
      'NewVendors', 'NewAttendees', 'PageViews', 'Notes', 'LastUpdated'
    ],
    statuses: [],
    color: '#3498db',
  },
};

/* ─── Helpers ─── */
function sanitize(val, max) {
  if (typeof val !== 'string') val = String(val || '');
  return val.trim().replace(/^[=+\-@]/, "'$&").slice(0, max || 500);
}

function now() { return new Date().toISOString(); }

function getSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const def = SHEET_DEFS[name];
    if (def && def.headers) {
      sheet.appendRow(def.headers);
      if (def.color) {
        const r = sheet.getRange('A1:' + String.fromCharCode(64 + def.headers.length) + '1');
        r.setBackground(def.color);
        r.setFontColor('#ffffff');
        r.setFontWeight('bold');
      }
    }
    const colCount = def ? def.headers.length : 10;
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, colCount, 120);
  }
  return sheet;
}

function ensureAllSheets(ss) {
  Object.keys(SHEET_DEFS).forEach(name => getSheet(ss, name));
}

function isAuthorized(data) {
  if (!INTERNAL_SECRET) return false;
  return data._secret === INTERNAL_SECRET;
}

function findRowByTID(sheet, tid) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(tid)) return i + 1;
  }
  return -1;
}

/* ─── Main POST ─── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.action) return respond({ error: 'Missing action' });

    if (!isAuthorized(data)) {
      notifyDiscord('🚨 Unauthorized Access', `Action: ${data.action}`, 15158332);
      return respond({ error: 'Unauthorized' });
    }

    if (!SHEET_ID) return respond({ error: 'SHEET_ID not configured' });

    const ss = SpreadsheetApp.openById(SHEET_ID);
    ensureAllSheets(ss);

    switch (data.action) {
      case 'submit':
        return handleSubmit(ss, data);
      case 'updateStatus':
        return handleUpdateStatus(ss, data);
      case 'getCities':
        return handleGetCities(ss);
      case 'updateCities':
        return handleUpdateCities(ss, data);
      case 'getVenues':
        return handleGetVenues(ss);
      case 'getAnalytics':
        return handleGetAnalytics(ss);
      case 'syncData':
        return handleSyncData(ss, data);
      case 'health':
        return respond({ status: 'ok', timestamp: now() });
      default:
        return respond({ error: 'Unknown action' });
    }
  } catch (err) {
    notifyDiscord('⚠️ System Error', sanitize(err.toString(), 200), 15158332);
    return respond({ error: 'Internal error', message: err.toString() });
  }
}

/* ─── GET handler ─── */
function doGet(e) {
  try {
    if (!SHEET_ID) return ContentService.createTextOutput(JSON.stringify({ error: 'Not configured' })).setMimeType(ContentService.MimeType.JSON);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const action = e.parameter.action || 'getCities';

    if (action === 'getCities') return handleGetCities(ss);
    if (action === 'getVenues') return handleGetVenues(ss);

    return respond({ error: 'Unknown action' });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/* ─── Actions ─── */

/* Submit form data */
function handleSubmit(ss, data) {
  const typeMap = {
    VENDOR: 'Vendors',
    VENUE: 'Venues',
    ATTENDEE: 'Attendees',
    CONTACT: 'Contacts',
  };

  const sheetName = typeMap[(data.type || '').toUpperCase()];
  if (!sheetName) return respond({ error: 'Invalid type' });

  const sheet = getSheet(ss, sheetName);
  const def = SHEET_DEFS[sheetName];

  const timestamp = now();
  const tid = sanitize(data.transactionID || ('TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase()), 50);
  const row = buildRow(data.type.toUpperCase(), data, timestamp, tid);

  sheet.appendRow(row);

  const emailPreview = data.email ? data.email.slice(0, 3) + '***' : 'N/A';
  notifyDiscord(
    '📝 New ' + data.type,
    `**Email:** ${emailPreview}\n**Name:** ${sanitize(data.name, 50)}\n**Status:** Pending\n**ID:** ${tid}`,
    3447003
  );

  return respond({ success: true, transactionID: tid, message: 'Submitted' });
}

/* Update status (from Stripe webhook or admin) */
function handleUpdateStatus(ss, data) {
  const typeMap = {
    VENDOR: 'Vendors',
    ATTENDEE: 'Attendees',
  };

  const sheetName = typeMap[(data.type || '').toUpperCase()];
  if (!sheetName) return respond({ error: 'Invalid type' });

  const tid = sanitize(data.transactionID, 50);
  if (!tid) return respond({ error: 'Missing transactionID' });

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return respond({ error: 'Sheet not found' });

  const rowIdx = findRowByTID(sheet, tid);
  if (rowIdx === -1) return respond({ error: 'Transaction not found' });

  const statusCol = 3;
  sheet.getRange(rowIdx, statusCol).setValue(sanitize(data.status, 50));
  const lastCol = 16;
  sheet.getRange(rowIdx, lastCol).setValue(now());

  if (data.receiptURL) {
    const receiptCol = sheetName === 'Vendors' ? 14 : 11;
    sheet.getRange(rowIdx, receiptCol).setValue(sanitize(data.receiptURL, 500));
  }

  if (data.stripeSessionID) {
    const sessionCol = sheetName === 'Vendors' ? 13 : 10;
    sheet.getRange(rowIdx, sessionCol).setValue(sanitize(data.stripeSessionID, 100));
  }

  const emoji = data.status === 'Paid' || data.status === 'Confirmed' ? '💰' : '🔄';
  const clr = data.status === 'Paid' || data.status === 'Confirmed' ? 3066993 : 15105570;
  notifyDiscord(
    `${emoji} ${data.type} ${data.status}`,
    `**ID:** ${tid.slice(0, 8)}***\n**Status:** ${data.status}`,
    clr
  );

  if ((data.status === 'Paid' || data.status === 'Confirmed') && data.email) {
    sendConfirmationEmail(data.type.toUpperCase(), {
      email: data.email,
      name: data.name || 'Valued Guest',
      tid: tid,
      business: data.businessName || '',
      ticketType: data.ticketType || 'General',
    });
  }

  return respond({ success: true, message: 'Updated' });
}

/* Get cities */
function handleGetCities(ss) {
  const sheet = ss.getSheetByName('Cities');
  if (!sheet) return respond([]);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return respond([]);
  const cities = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      cities.push({
        name: String(rows[i][0] || ''),
        status: String(rows[i][1] || 'Planned'),
        date: String(rows[i][2] || ''),
        venue: String(rows[i][3] || ''),
      });
    }
  }
  return respond(cities);
}

/* Update cities */
function handleUpdateCities(ss, data) {
  if (!Array.isArray(data.cities)) return respond({ error: 'Invalid format' });
  const sheet = getSheet(ss, 'Cities');
  sheet.clearContents();
  sheet.appendRow(SHEET_DEFS.Cities.headers);
  data.cities.forEach(c => {
    sheet.appendRow([
      sanitize(c.name || '', 100),
      sanitize(c.status || 'Planned', 50),
      sanitize(c.date || '', 50),
      sanitize(c.venue || '', 150),
      '', '', '', now(),
    ]);
  });
  notifyDiscord('🌍 Cities Synced', `${data.cities.length} cities updated`, 3447003);
  return respond({ success: true, count: data.cities.length });
}

/* Get venues for public view */
function handleGetVenues(ss) {
  const sheet = ss.getSheetByName('Venues');
  if (!sheet) return respond([]);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return respond([]);
  const venues = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && String(rows[i][1]) === 'Approved') {
      venues.push({
        name: String(rows[i][2] || ''),
        location: String(rows[i][6] || ''),
        city: String(rows[i][7] || ''),
        capacity: String(rows[i][8] || ''),
      });
    }
  }
  return respond(venues);
}

/* Get analytics dashboard data */
function handleGetAnalytics(ss) {
  const stats = {};
  Object.keys(SHEET_DEFS).forEach(name => {
    const s = ss.getSheetByName(name);
    if (s) stats[name] = Math.max(0, s.getLastRow() - 1);
  });

  let revenue = 0;
  const tSheet = ss.getSheetByName('Transactions');
  if (tSheet) {
    const tRows = tSheet.getDataRange().getValues();
    for (let i = 1; i < tRows.length; i++) {
      const amt = parseFloat(tRows[i][6]) || 0;
      const st = String(tRows[i][8] || '');
      if (st === 'Completed' || st === 'Paid') revenue += amt;
    }
  }

  stats.Revenue = revenue;
  return respond(stats);
}

/* Full data sync (for admin panel) */
function handleSyncData(ss, data) {
  if (!data.sheet || !Array.isArray(data.rows)) return respond({ error: 'Invalid format' });
  const sheet = getSheet(ss, data.sheet);
  if (!data.headers) return respond({ error: 'Missing headers' });

  sheet.clearContents();
  sheet.appendRow(data.headers);
  data.rows.forEach(r => sheet.appendRow(r.map(v => sanitize(v, 500))));

  return respond({ success: true, count: data.rows.length });
}

/* ─── Row Builder ─── */
function buildRow(type, data, timestamp, tid) {
  const s = (v, max) => sanitize(v, max);
  switch (type) {
    case 'VENDOR':
      return [timestamp, tid, 'Pending', s(data.name, 100), s(data.businessName, 150),
              s(data.email, 254), s(data.phone, 20), s(data.instagram, 100),
              s(data.website, 200), s(data.tier, 20), s(data.amount, 20),
              s(data.paymentMethod, 20), '', '', '', now()];
    case 'ATTENDEE':
      return [timestamp, tid, 'Pending', s(data.name, 100), s(data.email, 254),
              s(data.phone, 20), s(data.ticketType, 30), s(data.amount, 20),
              s(data.referrer, 100), '', '', 'No', '', now()];
    case 'VENUE':
      return [timestamp, 'In Review', s(data.venueName, 150), s(data.name, 100),
              s(data.email, 254), s(data.phone, 20), s(data.location, 200),
              s(data.city, 100), s(data.capacity, 20), s(data.hasParking, 10),
              s(data.hasWifi, 10), s(data.indoorOutdoor, 20), s(data.notes, 1000),
              '', s(data.eventDate, 50), now()];
    case 'CONTACT':
      return [timestamp, s(data.name, 100), s(data.email, 254), s(data.phone, 20),
              s(data.subject, 200), s(data.message, 2000), s(data.source, 50),
              'No', '', now()];
    default:
      return [timestamp, tid, 'Unknown'];
  }
}

/* ─── Email ─── */
function sendConfirmationEmail(type, d) {
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
        'In 3-5 days you\'ll receive:',
        '• Event timeline & load-in instructions',
        '• Promotional materials featuring your brand',
        '• Social media schedule & vendor spotlight details',
        '',
        'Questions? Reply to this email or contact us at contact@foreignaffairsmarket.com',
        '',
        '— The MARKETPEACE Team',
      ].join('\n'),
    },
    ATTENDEE: {
      subject: 'Your MARKETPEACE Ticket is Confirmed!',
      body: [
        'Hey {NAME}!',
        '',
        'You\'re all set — your ticket to MARKETPEACE is confirmed.',
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
      body: tpl.body
        .replace(/{NAME}/g, sanitize(d.name, 100))
        .replace(/{TID}/g, sanitize(d.tid, 50))
        .replace(/{BUSINESS}/g, sanitize(d.business, 150))
        .replace(/{TICKET_TYPE}/g, sanitize(d.ticketType, 30)),
      name: 'MARKETPEACE',
    });
  } catch (e) {
    console.error('Email failed: ' + e.toString());
  }
}

/* ─── Discord ─── */
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
    console.error('Discord error: ' + e.toString());
  }
}

/* ─── Auto Sync (every 5 min) ─── */
function autoSync() {
  if (!SHEET_ID) return;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureAllSheets(ss);

  const nowDate = new Date();
  const isTopOfHour = nowDate.getMinutes() < 5;

  let stats = '';
  Object.keys(SHEET_DEFS).forEach(name => {
    const s = ss.getSheetByName(name);
    if (s) {
      const count = Math.max(0, s.getLastRow() - 1);
      stats += `**${name}:** ${count}\n`;
    }
  });

  if (isTopOfHour) {
    notifyDiscord('📡 System Health Pulse', `All systems operational.\n\n${stats}`, 3447003);
  }
}

/* ─── Response Builder ─── */
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

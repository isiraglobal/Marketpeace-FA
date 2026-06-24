/**
 * SECURITY-HARDENED Google Apps Script for MARKETPEACE
 * Supports Vendors, Attendees, Venues, and Contacts with Stripe Payment Status tracking.
 *
 * DEPLOYMENT STEPS:
 * 1. In Apps Script Editor: File → Project Properties → Script Properties
 * 2. Add these properties:
 *    - SHEET_ID: Your Google Spreadsheet ID (DO NOT hardcode)
 *    - DISCORD_WEBHOOK_URL: Your Discord webhook URL (DO NOT hardcode, and REGENERATE the old one)
 *    - INTERNAL_SECRET: A strong random secret (same value as INTERNAL_WEBHOOK_SECRET in Vercel)
 *
 * SECURITY FIXES APPLIED:
 *  - CRIT-2: Discord webhook URL removed from source \u2014 loaded from Script Properties
 *  - CRIT-3: Google Sheet ID removed from source \u2014 loaded from Script Properties
 *  - CRIT-5: All incoming requests now validated with INTERNAL_SECRET token
 *  - HIGH-2:  updateStatus requests require valid Authorization header
 *  - HIGH-3:  Input sanitization applied to all string fields
 *  - MED-7:   PII not logged; only partial IDs in logs
 */

// SECURITY (CRIT-2, CRIT-3): Read sensitive values from Script Properties, never hardcode
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const SHEET_ID = SCRIPT_PROPS.getProperty('SHEET_ID');
const DISCORD_WEBHOOK_URL = SCRIPT_PROPS.getProperty('DISCORD_WEBHOOK_URL');
const INTERNAL_SECRET = SCRIPT_PROPS.getProperty('INTERNAL_SECRET');

// Email configuration (non-sensitive; safe to keep here)
const EMAIL_CONFIG = {
  SENDER_NAME: 'MarketPeace Team',

  VENDOR: {
    subject: "You're In! Your Vendor Spot is Secured at MarketPeace",
    body: `Hello {NAME},

Welcome to the MarketPeace family! We're excited to confirm your vendor registration is paid and secured.

Your Confirmation Details:
Business: {BUSINESS}
Transaction ID: {TID}

What's Next?
Keep this email for your records. Within 3-5 days, you'll receive:
- Event timeline & load-in instructions
- Promotional materials featuring your brand
- Social media schedule & vendor spotlight details

Questions?
Reach out anytime:
Email: contact@marketpeace.com
Website: www.marketpeace.com

You're not just renting a booth — you're joining a community of creators ready to shine.

Best,
The MarketPeace Team`
  },

  ATTENDEE: {
    subject: "You're All Set! Your MarketPeace Ticket is Confirmed",
    body: `Hi {NAME}!

Thanks for joining us! Your ticket for MarketPeace is confirmed and we can't wait to see you.

Your Ticket Info:
Ticket Type: {TICKET_TYPE}
Transaction ID: {TID}

Event Day Reminder:
Show this email at the entrance for entry. Arrive early for goodie bags (first 100 attendees!).

Got Questions?
Email: contact@marketpeace.com
Website: www.marketpeace.com

See you soon!
The MarketPeace Team`
  }
};

const SHEETS = {
  VENDOR: 'Vendors',
  ATTENDEE: 'Attendees',
  VENUE: 'Venues',
  CONTACT: 'Inquiries'
};

// SECURITY: Allowed types for validation
const ALLOWED_TYPES = ['VENDOR', 'ATTENDEE', 'VENUE', 'CONTACT'];
const ALLOWED_STATUSES = ['Pending', 'Paid', 'In Review', 'Rejected'];

/**
 * Sanitizes a string value — trims whitespace and caps length.
 * Prevents formula injection in Google Sheets (cells starting with =, +, -, @).
 */
function sanitizeString(val, maxLen) {
  if (typeof val !== 'string' && val !== undefined && val !== null) {
    val = String(val);
  }
  if (!val) return '';
  // SECURITY: Remove leading characters that trigger formula execution in Sheets
  val = val.trim().replace(/^[=+\-@]/, "'$&");
  return val.slice(0, maxLen || 500);
}

/**
 * Validates that the request comes from our legitimate webhook handler.
 * SECURITY (CRIT-5, HIGH-2): Rejects any request without the correct INTERNAL_SECRET.
 */
function validateInternalSecret(headers) {
  if (!INTERNAL_SECRET) {
    // Misconfiguration — fail closed
    console.error('INTERNAL_SECRET not configured in Script Properties');
    return false;
  }

  const authHeader = headers['Authorization'] || headers['authorization'] || '';
  const expectedToken = `Bearer ${INTERNAL_SECRET}`;

  // SECURITY: Constant-time comparison is not available in Apps Script,
  // but this is already server-to-server so the main risk is the secret being
  // unset (handled above) rather than timing attacks.
  return authHeader === expectedToken;
}

/**
 * Main POST handler.
 * All form submissions and status updates come through here.
 */
function doPost(e) {
  try {
    // SECURITY: Validate SHEET_ID is configured
    if (!SHEET_ID) {
      console.error('SHEET_ID not configured in Script Properties');
      return createResponse({ result: 'error', error: 'Server misconfiguration' });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'submit';
    const headers = e.parameter || {};

    // SECURITY (CRIT-5): All actions require a valid internal secret
    // In Apps Script, headers come via e.parameter for web app deployments.
    // For direct testing, the secret can be in the body as `_secret`.
    const authFromBody = data._secret ? `Bearer ${data._secret}` : '';
    const authFromHeaders = headers.Authorization || headers.authorization || '';
    const auth = authFromHeaders || authFromBody;

    const expectedToken = `Bearer ${INTERNAL_SECRET}`;
    if (!INTERNAL_SECRET || auth !== expectedToken) {
      // SECURITY: Log the attempt without revealing the secret or caller details
      console.warn('Rejected request: invalid or missing INTERNAL_SECRET');
      sendDiscordNotification(
        '🚨 Unauthorized Access Attempt',
        `An unauthorized request was made to the Apps Script endpoint.\n**Action:** ${action}`,
        15158332
      );
      return createResponse({ result: 'error', error: 'Unauthorized' });
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);

    if (action === 'submit') {
      return handleSubmit(ss, data);
    } else if (action === 'updateStatus') {
      return handleUpdateStatus(ss, data);
    } else {
      return createResponse({ result: 'error', error: 'Unknown action' });
    }
  } catch (error) {
    sendDiscordNotification(
      '⚠️ System Error',
      `**Action:** doPost\n**Error:** ${sanitizeString(error.toString(), 200)}`,
      15158332
    );
    return createResponse({ result: 'error', error: 'Internal error' });
  }
}

function handleSubmit(ss, data) {
  // SECURITY: Validate type against whitelist
  const rawType = (data.type || '').toUpperCase();
  if (!ALLOWED_TYPES.includes(rawType)) {
    return createResponse({ result: 'error', error: 'Invalid type' });
  }

  const sheetName = SHEETS[rawType] || 'General';
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = getHeaders(rawType);
    sheet.appendRow(headers);
  }

  const rowData = getRowData(rawType, data);
  sheet.appendRow(rowData);

  // SECURITY (MED-7): Only log type and partial email in Discord — no full PII
  const emailPartial = data.email ? data.email.slice(0, 3) + '***' : 'N/A';
  sendDiscordNotification(
    '📝 New Submission',
    `**Type:** ${rawType}\n**Email (partial):** ${emailPartial}\n**Status:** Pending`,
    3447003
  );

  return createResponse({ result: 'success', message: 'Data added as Pending' });
}

function handleUpdateStatus(ss, data) {
  const rawType = (data.type || '').toUpperCase();
  const transactionID = sanitizeString(data.transactionID, 50);
  const status = data.status;

  // SECURITY: Validate inputs
  if (!ALLOWED_TYPES.includes(rawType)) {
    return createResponse({ result: 'error', error: 'Invalid type' });
  }
  if (!transactionID) {
    return createResponse({ result: 'error', error: 'Missing transactionID' });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return createResponse({ result: 'error', error: 'Invalid status value' });
  }

  const sheetName = SHEETS[rawType];
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return createResponse({ result: 'error', message: 'Sheet not found' });

  const rows = sheet.getDataRange().getValues();
  const idIndex = 1; // Transaction ID is in column B

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] === transactionID) {
      sheet.getRange(i + 1, 3).setValue(status);

      const receiptURL = sanitizeString(data.receiptURL, 500);
      const receiptCol = rawType === 'VENDOR' ? 11 : 10;
      sheet.getRange(i + 1, receiptCol).setValue(receiptURL || '');

      // SECURITY (MED-7): Partial TID in Discord logs only
      const tidPartial = transactionID.slice(0, 8) + '***';
      sendDiscordNotification(
        status === 'Paid' ? '💰 Payment Received' : '🔄 Status Update',
        `**Type:** ${rawType}\n**ID (partial):** ${tidPartial}\n**Status:** ${status}`,
        status === 'Paid' ? 3066993 : 15105570
      );

      if (status === 'Paid') {
        const row = rows[i];
        let emailData = {};

        if (rawType === 'VENDOR') {
          emailData = {
            email: sanitizeString(row[5], 254),
            name: sanitizeString(row[3], 100),
            business: sanitizeString(row[4], 150),
            tid: transactionID
          };
        } else if (rawType === 'ATTENDEE') {
          emailData = {
            email: sanitizeString(row[4], 254),
            name: sanitizeString(row[3], 100),
            ticketType: sanitizeString(row[5], 30),
            tid: transactionID
          };
        }

        if (emailData.email) {
          sendConfirmationEmail(rawType, emailData);
        }
      }

      return createResponse({ result: 'success', message: 'Status updated' });
    }
  }

  return createResponse({ result: 'error', message: 'Transaction ID not found' });
}

function sendConfirmationEmail(type, data) {
  const config = EMAIL_CONFIG[type];
  if (!config) return;

  let subject = config.subject;
  let body = config.body;

  // SECURITY: Sanitize all interpolated values to prevent email injection
  body = body.replace(/{NAME}/g, sanitizeString(data.name, 100) || '')
    .replace(/{TID}/g, sanitizeString(data.tid, 50) || '')
    .replace(/{BUSINESS}/g, sanitizeString(data.business, 150) || '')
    .replace(/{TICKET_TYPE}/g, sanitizeString(data.ticketType, 30) || '');

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body,
      name: EMAIL_CONFIG.SENDER_NAME
    });
  } catch (e) {
    console.error('Email send failed: ' + e.toString());
  }
}

function sendDiscordNotification(title, message, color) {
  color = color || 3447003;
  if (!DISCORD_WEBHOOK_URL) {
    // SECURITY (CRIT-2): Discord URL not configured — fail silently, don't expose error
    console.warn('DISCORD_WEBHOOK_URL not configured in Script Properties');
    return;
  }

  try {
    const payload = {
      embeds: [{
        title: sanitizeString(title, 200),
        description: sanitizeString(message, 2000),
        color: color,
        timestamp: new Date().toISOString(),
        footer: { text: 'MARKETPEACE Infrastructure Monitor' }
      }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
  } catch (e) {
    console.error('Discord Notify Error: ' + e.toString());
  }
}

function getHeaders(type) {
  switch (type) {
    case 'VENDOR':
      return ['Timestamp', 'TransactionID', 'Status', 'Name', 'BusinessName', 'Email', 'Instagram', 'PaymentMethod', 'Amount', 'StripeSessionID', 'ReceiptURL'];
    case 'ATTENDEE':
      return ['Timestamp', 'TransactionID', 'Status', 'Name', 'Email', 'TicketType', 'Referrer', 'Amount', 'StripeSessionID', 'ReceiptURL'];
    case 'VENUE':
      return ['Timestamp', 'Status', 'VenueName', 'ContactName', 'Email', 'Phone', 'Location', 'Capacity', 'Notes'];
    case 'CONTACT':
      return ['Timestamp', 'Name', 'Email', 'Subject', 'Message'];
    default:
      return ['Timestamp', 'Data'];
  }
}

function getRowData(type, data) {
  const ts = new Date().toISOString(); // Use server time, not client-supplied
  const status = 'Pending';
  const tid = sanitizeString(data.transactionID, 50);

  switch (type) {
    case 'VENDOR':
      return [
        ts, tid, status,
        sanitizeString(data.name, 100),
        sanitizeString(data.businessName, 150),
        sanitizeString(data.email, 254),
        sanitizeString(data.instagram, 100),
        sanitizeString(data.paymentMethod, 20),
        '', // Amount set server-side from tier, not from this form data
        '',
        ''
      ];
    case 'ATTENDEE':
      return [
        ts, tid, status,
        sanitizeString(data.name, 100),
        sanitizeString(data.email, 254),
        sanitizeString(data.ticketType, 30),
        sanitizeString(data.referrer, 100),
        '', // Amount from server
        '',
        ''
      ];
    case 'VENUE':
      return [
        ts, 'In Review',
        sanitizeString(data.venueName, 150),
        sanitizeString(data.name, 100),
        sanitizeString(data.email, 254),
        sanitizeString(data.phone, 20),
        sanitizeString(data.location, 200),
        sanitizeString(data.capacity, 20),
        sanitizeString(data.notes, 1000)
      ];
    case 'CONTACT':
      return [
        ts,
        sanitizeString(data.name, 100),
        sanitizeString(data.email, 254),
        sanitizeString(data.subject, 200),
        sanitizeString(data.message, 2000)
      ];
    default:
      return [ts, 'Unknown type'];
  }
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Auto-Update Function — Trigger every 1-5 minutes via Apps Script Triggers.
 * Sends hourly health pulse to Discord.
 */
function autoUpdateSystem() {
  try {
    if (!SHEET_ID) return;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const now = new Date();

    // Summary pulse once an hour
    if (now.getMinutes() < 5) {
      let stats = '';
      Object.keys(SHEETS).forEach(key => {
        const sheet = ss.getSheetByName(SHEETS[key]);
        if (sheet) stats += `**${key}:** ${sheet.getLastRow() - 1} entries\n`;
      });

      sendDiscordNotification(
        '📡 System Health Pulse',
        `Infrastructure is active.\n\n${stats}`,
        3447003
      );
    }
  } catch (e) {
    console.error('AutoUpdate Error: ' + e.toString());
  }
}

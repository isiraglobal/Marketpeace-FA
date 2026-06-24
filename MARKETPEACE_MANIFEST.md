# 🛡️ MARKETPEACE | System Manifest & Deployment Guide

This document contains critical system information, environment configuration, and authenticity details for the **MarketPeace** platform.

---

## 🏛️ Project Authenticity
*   **Official Name**: MarketPeace
*   **Parent Organization**: Foreign Affairs Market / Isira Global
*   **Market Focus**: US Luxury Creator Culture & Commerce
*   **Platform Version**: 1.0.0 (Production Hardened)

---

## 🔑 Environment Variables & API Keys
To deploy the platform, the following keys must be configured in your **Hosting Provider's Environment Settings**. 

> [!CAUTION]
> **NEVER** commit actual keys to the repository. Only place them in the secure environment variables of your server.

| Variable Name | Description | Example / Placeholder |
| :--- | :--- | :--- |
| `ADMIN_ID` | Administrative Login ID | `admin_user_01` |
| `ADMIN_PASS` | Administrative Password | `[Your_Secure_Password]` |
| `STRIPE_SECRET_KEY` | Stripe Production Secret Key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signature Key | `whsec_...` |
| `GOOGLE_SCRIPT_URL` | backend Google Apps Script URL | `https://script.google.com/macros/s/...` |
| `INTERNAL_WEBHOOK_SECRET` | Shared secret between Server & GAS | `[Random_Secret_String]` |
| `APP_URL` | Base URL of the live site | `https://marketpeace.isira.club` |

---

## 📬 Contact & Reachout Details
These are the official communication channels for the platform.

*   **General Inquiry**: `contact@foreignaffairs.com`
*   **Vendor Curation**: `vendors@foreignaffairs.com`
*   **Instagram**: `@foreignaffairsmarket`
*   **Official Website**: `marketpeace.isira.club`

---

## 🔒 Security Architecture Summary
As of the latest audit, the following enterprise-level security measures are active:
1.  **Strict Content Security**: Prevents XSS, frame injection, and unauthorized data exfiltration.
2.  **Secure Admin Portal**: Uses protected, server-only cookies for session management.
3.  **Zero-Trust API**: All external calls are proxied through server-side handlers to shield keys from the browser.
4.  **Transaction Integrity**: Mandatory digital signature verification on all financial webhooks.
5.  **Payload Sanitization**: All inputs are strictly validated and sanitized before storage.

---

## 🚀 Post-Deployment Checklist
1.  [ ] Verify all **Environment Variables** are set in the hosting dashboard.
2.  [ ] Trigger a **Build/Deploy** to apply the hardened security headers.
3.  [ ] Test the **/admin** login with your configured credentials.
4.  [ ] Ensure the **Stripe Webhook** URL is set in your Stripe Dashboard to: `https://[your-domain]/api/stripe-webhook`.

---

## 🛠️ Infrastructure Scripts
The following assets are provided in the `/infrastructure` directory for reference and secondary setup:
*   **`backend_apps_script.js`**: The full secure logic for the Google Apps Script backend (to be deployed on Google).

---
*Created by Antigravity AI | Advanced Agentic Coding for Isira Global*

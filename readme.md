
---

# 🍕 Aliina’s Pizza – Foodtruck Ordering & POS App

A full-stack foodtruck ordering system with **online ordering**, **kitchen display**, and **on-site card payments via Stripe Terminal (WisePad 3)**.
Built for **mobile-first usage** and **Android POS devices** using **Capacitor**.

---

## ✨ Features

### Customer (Web)

* Online ordering (mobile & desktop)
* Stripe Checkout payments
* Order success page with pickup info & map
* Email confirmation
* Stock-aware ordering

### Kitchen (POS)

* Real-time incoming orders
* Cash checkout flow
* **Card payments via WisePad 3 (Stripe Terminal)**
* Automatic stock deduction
* Runs as **Android app** (Capacitor)

### Payments

* Stripe Checkout (web)
* Stripe Terminal (Android, Bluetooth)
* WisePad 3 support
* Live-mode ready (no sandbox reader required)

---

## 🧱 Tech Stack

### Frontend

* **React**
* **Vite**
* **React Router**
* **Capacitor (Android)**
* CSS (custom, no framework)

### Backend (API routes)

* **Node / Vercel Serverless**
* Stripe API
* Google Sheets (orders & stock)
* Nodemailer (email confirmations)

### Payments

* **Stripe Checkout**
* **Stripe Terminal**
* `@capacitor-community/stripe-terminal`

---

## 📱 Platforms

| Platform                | Supported                   |
| ----------------------- | --------------------------- |
| Windows / macOS browser | ✅                           |
| Android Chrome          | ✅                           |
| Android App (Capacitor) | ✅ **required for Terminal** |
| iOS                     | ❌ (not implemented)         |

---

## 🔐 Environment Variables

Create `.env` configuration in Vercel:

```env
STRIPE_SECRET_KEY
RESEND_KEY
STRIPE_READER_ID
KITCHEN_PIN

---

## 🧾 Storage Strategy (Important)

This app **intentionally uses `localStorage` instead of `sessionStorage`**.

### Why?

* Android Chrome clears `sessionStorage` during redirects (Stripe)
* Causes white screens / missing data
* `localStorage` is stable across:

  * redirects
  * reloads
  * low-memory situations

### Stored in `localStorage`

* cart
* paymentData
* location
* order guards (`pushed_<sessionId>`, `mail_<sessionId>`)

---

## 💳 Stripe Terminal (Android)

### Supported Reader

* **WisePad 3**
* Bluetooth connection
* Live mode only

### Requirements

* Android 10+
* Bluetooth enabled
* Permissions:
  * `BLUETOOTH_SCAN`
  * `BLUETOOTH_CONNECT`
  * `BLUETOOTH_ADVERTISE`
  * Location (required for BLE scan)

### Notes

* App handles MIUI / Samsung differences
* Uses **event-based discovery** (stable on MIUI)
* Auto-reconnect disabled on first connect for reliability

---

## ▶️ Development

### Install

```bash
npm install

# Deploy web-only or web & android

npm run deploy
npm run android

---

## 🧪 Known Limitations

* iOS not supported
* One active Terminal payment at a time
* Single-location setup
* No multi-user auth (intended for foodtruck POS)

---

## ✅ Production Checklist

* [ ] Stripe keys set to **LIVE**
* [ ] Terminal location ID correct
* [ ] Android permissions granted
* [ ] HTTPS domain (required for Stripe)
* [ ] localStorage used everywhere (no sessionStorage)

---

## 📄 License

Copyright © 2026 Soe Elamus OÜ (VAT# EE102909436)

All rights reserved.
See the LICENSE file for details.

---

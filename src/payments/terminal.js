// src/payments/terminal.js
import { Capacitor } from "@capacitor/core";
import {
  StripeTerminal,
  TerminalConnectTypes,
  TerminalEventsEnum,
} from "@capacitor-community/stripe-terminal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const LOCATION_ID = "tml_GXCRdwizjsEgt2"; // jouw live location

// centen helper
export const eurosToCents = (eur) => Math.round(Number(eur) * 100);

// -------------------- internal state --------------------
let initialized = false;
let listenersAttached = false;

let terminalLoaded = false;
let loadedPromise = null;

let tokenReady = false;
let tokenReadyPromise = null;
let tokenReadyResolve = null;

// Discovery via events (MIUI safe)
let discoveredResolve = null;
let lastDiscoveredReaders = [];
let connectedResolve = null;
let paymentInFlight = null;

// -------------------- helpers --------------------
function log(...args) {
  console.log("[TERMINAL_DEBUG]", ...args);
}

function assertNative() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Terminal werkt alleen in de Android app (Capacitor).");
  }
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL ontbreekt (zet naar je Vercel domain).");
  }
}

function waitForConnected(timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    connectedResolve = resolve;
    setTimeout(() => reject(new Error("Reader connect timeout")), timeoutMs);
  });
}

async function withTimeout(promise, ms, label) {
  return await Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

function waitForToken() {
  if (tokenReady) return Promise.resolve(true);
  if (tokenReadyPromise) return tokenReadyPromise;

  tokenReadyPromise = new Promise((resolve) => {
    tokenReadyResolve = resolve;
  });

  return tokenReadyPromise;
}

function waitForLoaded(timeoutMs = 4000) {
  if (terminalLoaded) return Promise.resolve(true);
  if (loadedPromise) return loadedPromise;

  loadedPromise = new Promise(async (resolve) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      log("Loaded event timeout (continuing anyway)");
      resolve(false);
    }, timeoutMs);

    const h = await StripeTerminal.addListener(
      TerminalEventsEnum.Loaded,
      async () => {
        if (done) return;
        done = true;
        terminalLoaded = true;
        clearTimeout(timer);
        try {
          await h.remove();
        } catch {}
        log("Loaded event received ✅");
        resolve(true);
      },
    );
  });

  return loadedPromise;
}

function waitForDiscoveredReaders(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    discoveredResolve = resolve;
    setTimeout(
      () => reject(new Error("No readers discovered (timeout)")),
      timeoutMs,
    );
  });
}

async function fetchConnectionTokenAndSet() {
  const r = await fetch(`${API_BASE}/api/terminal/connection_token`, {
    method: "POST",
  });
  const j = await r.json();
  if (!j?.secret)
    throw new Error("connection_token endpoint gaf geen {secret} terug");
  await StripeTerminal.setConnectionToken({ token: j.secret });
}

// -------------------- listeners --------------------
async function ensureListeners() {
  if (listenersAttached) return;

  // Loaded (debug + state)
  await StripeTerminal.addListener(TerminalEventsEnum.Loaded, () => {
    terminalLoaded = true;
    log("EVENT: Loaded ✅");
  });

  // Connection token request
  await StripeTerminal.addListener(
    TerminalEventsEnum.RequestedConnectionToken,
    async () => {
      try {
        log("RequestedConnectionToken → fetching token...");
        await fetchConnectionTokenAndSet();
        log("Connection token set ✅");

        tokenReady = true;
        if (tokenReadyResolve) tokenReadyResolve(true);
      } catch (e) {
        log("Token set ERROR:", e?.message || String(e));
      }
    },
  );

  // Discovery results (this is the big MIUI-safe part)
  await StripeTerminal.addListener(
    TerminalEventsEnum.DiscoveredReaders,
    ({ readers }) => {
      lastDiscoveredReaders = readers || [];
      log("EVENT: DiscoveredReaders count =", lastDiscoveredReaders.length);

      if (discoveredResolve) {
        discoveredResolve(lastDiscoveredReaders);
        discoveredResolve = null;
      }
    },
  );

  // Optional debug events
  await StripeTerminal.addListener(
    TerminalEventsEnum.ConnectionStatusChange,
    ({ status }) => {
      log("ConnectionStatusChange:", status);
    },
  );

  await StripeTerminal.addListener(TerminalEventsEnum.ConnectedReader, () => {
    log("ConnectedReader ✅");
    if (connectedResolve) {
      connectedResolve(true);
      connectedResolve = null;
    }
  });

  await StripeTerminal.addListener(
    TerminalEventsEnum.RequestDisplayMessage,
    ({ messageType, message }) => {
      log("RequestDisplayMessage:", messageType, message);
    },
  );

  await StripeTerminal.addListener(
    TerminalEventsEnum.RequestReaderInput,
    ({ options, message }) => {
      log("RequestReaderInput:", JSON.stringify(options), message);
    },
  );

  await StripeTerminal.addListener(
    TerminalEventsEnum.PaymentStatusChange,
    ({ status }) => {
      log("PaymentStatusChange:", status);
    },
  );

  await StripeTerminal.addListener(TerminalEventsEnum.Failed, (info) => {
    log("FAILED:", JSON.stringify(info));
  });

  await StripeTerminal.addListener(
    TerminalEventsEnum.ConfirmedPaymentIntent,
    () => {
      log("ConfirmedPaymentIntent ✅");
    },
  );

  await StripeTerminal.addListener(
    TerminalEventsEnum.UnexpectedReaderDisconnect,
    ({ reader }) => {
      log("UnexpectedReaderDisconnect:", reader?.serialNumber || "(unknown)");
    },
  );

  await StripeTerminal.addListener(
    TerminalEventsEnum.DisconnectedReader,
    ({ reason }) => {
      log("DisconnectedReader reason:", reason || "(no reason)");
    },
  );

  listenersAttached = true;
}

// -------------------- public API --------------------
export async function initTerminal({ isTest = false } = {}) {
  assertNative();
  if (initialized) return;

  await ensureListeners();

  log(
    "TerminalConnectTypes keys =",
    JSON.stringify(Object.keys(TerminalConnectTypes)),
  );
  log("Initializing terminal. isTest =", isTest);

  await StripeTerminal.initialize({ isTest });

  // Wait for SDK + token
  await waitForLoaded();
  await withTimeout(waitForToken(), 8000, "waitForToken");

  initialized = true;
  log("Terminal loaded & initialized ✅");
}

/**
 * Connect once to the first discovered Bluetooth reader (WisePad 3).
 * Uses event-based discovery because some devices return "-1" from discoverReaders().
 */
export async function connectReaderOnce() {
  assertNative();
  await initTerminal({ isTest: false });

  const connectedRes = await StripeTerminal.getConnectedReader();
  if (connectedRes?.reader) {
    log("Already connected:", connectedRes.reader.serialNumber);
    return connectedRes.reader;
  }

  // Cancel any previous discovery
  await StripeTerminal.cancelDiscoverReaders().catch(() => {});
  discoveredResolve = null;

  log("Starting discoverReaders(BLUETOOTH)… locationId =", LOCATION_ID);

  // Start scanning (ignore return value; some ROMs return -1)
  StripeTerminal.discoverReaders({
    type: TerminalConnectTypes.Bluetooth,
    locationId: LOCATION_ID,
  }).catch((e) =>
    log("discoverReaders promise rejected:", e?.message || String(e)),
  );

  // Wait for event list
  const readers = await waitForDiscoveredReaders(15000);

  log(
    "Discovered readers:",
    readers.map((r) => `${r.label} (${r.serialNumber})`).join(", ") || "(none)",
  );

  if (!readers.length) {
    throw new Error(
      "Geen WisePad gevonden. Zet WisePad in pairing mode en zorg dat hij niet gekoppeld is aan een ander toestel.",
    );
  }

  // Connect to first reader
  log("Connecting to first reader:", readers[0].serialNumber, readers[0].label);

  // stop discovery before connect
  await StripeTerminal.cancelDiscoverReaders().catch(() => {});
  await new Promise((r) => setTimeout(r, 400)); // kleine pause

  connectedResolve = null;

  StripeTerminal.connectReader({
    reader: readers[0],
    autoReconnectOnUnexpectedDisconnect: false,
  }).catch((e) => log("connectReader rejected:", e?.message || String(e)));

  await withTimeout(waitForConnected(20000), 22000, "waitForConnected");

  const after = await StripeTerminal.getConnectedReader();
  log("Connected reader after connect =", JSON.stringify(after));
  return after?.reader;
}

/**
 * Start a Terminal payment: create PI on server → collect → confirm.
 */
export async function startTerminalPayment({ totalEur, orderId }) {
  assertNative();

  if (paymentInFlight) {
    log("Payment already in flight → returning same promise");
    return paymentInFlight;
  }

  paymentInFlight = (async () => {
    try {
      await connectReaderOnce();

      const amount = eurosToCents(totalEur);
      log("Creating PaymentIntent… amount =", amount, "orderId =", orderId);

      const r = await fetch(`${API_BASE}/api/terminal/payment_intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "eur", orderId }),
      });

      if (!r.ok) throw new Error(await r.text());
      const { client_secret, id } = await r.json();
      if (!client_secret) throw new Error("payment_intent endpoint gaf geen client_secret terug");

      log("Collecting payment method… PI =", id);
      await withTimeout(
        StripeTerminal.collectPaymentMethod({ paymentIntent: client_secret }),
        90000,
        "collectPaymentMethod"
      );

      log("Confirming payment intent… PI =", id);
      await withTimeout(
        StripeTerminal.confirmPaymentIntent(),
        30000,
        "confirmPaymentIntent"
      );

      log("Payment finished ✅ PI =", id);
      return { paymentIntentId: id };
    } finally {
      paymentInFlight = null;
    }
  })();

  return paymentInFlight;
}


/**
 * Optional: disconnect reader
 */
export async function disconnectReader() {
  assertNative();
  await StripeTerminal.disconnectReader();
}
export async function cancelCurrentTerminalAction() {
  try { await StripeTerminal.cancelCollectPaymentMethod(); } catch {}
  try { await StripeTerminal.cancelDiscoverReaders(); } catch {}
}

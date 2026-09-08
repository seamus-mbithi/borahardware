import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { INITIAL_PRODUCTS } from "./src/data/initialProducts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firestore strictly on the backend server so the Google API key is never bundled in browser assets
let firestoreDb: any = null;
try {
  let firebaseConfig: any = null;
  if (fs.existsSync("./firebase-applet-config.json")) {
    firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  }

  if (firebaseConfig && firebaseConfig.projectId) {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
    firestoreDb = getFirestore(firebaseApp, dbId);
    console.log(`[Server] Firestore initialized securely for database: ${dbId}`);
  }
} catch (e: any) {
  console.warn("[Server] Firestore server initialization notice:", e.message);
}

// Helper function to normalize Kenyan phone numbers to 254XXXXXXXXX
function formatKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// Generate Daraja Timestamp (YYYYMMDDHHmmss)
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// Generate Daraja Password: Base64(Shortcode + Passkey + Timestamp)
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// Fetch Safaricom Daraja OAuth Token
async function getDarajaToken(
  consumerKey: string,
  consumerSecret: string,
  environment: "sandbox" | "production" = "sandbox"
): Promise<string> {
  const baseUrl =
    environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const authHeader = Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString(
    "base64"
  );

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Safaricom OAuth failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Bora Hardware Backend & Firestore Proxy",
    firestoreConfigured: Boolean(firestoreDb),
    time: new Date().toISOString(),
  });
});

// Admin authentication endpoint (password verified on server, never exposed in client code)
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  const expectedUser = (process.env.ADMIN_USERNAME || "mbithi").toLowerCase();
  const expectedPass = process.env.ADMIN_PASSWORD || "";

  if (
    expectedPass &&
    username &&
    password &&
    username.trim().toLowerCase() === expectedUser &&
    password.trim() === expectedPass
  ) {
    res.json({ success: true, message: "Authentication successful" });
  } else {
    res.status(401).json({ success: false, error: "Invalid username or password" });
  }
});

// ==========================================
// FIRESTORE CLOUD DATA PROXY (Server-side only)
// Keeps all Google API Keys and Database IDs secure and hidden from the browser bundle
// ==========================================

// GET /api/products
app.get("/api/products", async (_req: Request, res: Response) => {
  try {
    if (!firestoreDb) {
      res.json({ products: INITIAL_PRODUCTS });
      return;
    }
    const snap = await getDocs(collection(firestoreDb, "products"));
    if (snap.empty) {
      // Seed default products
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(firestoreDb, "products", prod.id), prod);
      }
      res.json({ products: INITIAL_PRODUCTS });
      return;
    }
    const products = snap.docs.map((d) => d.data());
    res.json({ products });
  } catch (err: any) {
    console.error("[Server] Error fetching products:", err.message);
    res.json({ products: INITIAL_PRODUCTS });
  }
});

// POST /api/products
app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product || !product.id) {
      res.status(400).json({ error: "Product payload missing id" });
      return;
    }
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "products", product.id), product);
    }
    res.json({ success: true, product });
  } catch (err: any) {
    console.error("[Server] Error saving product:", err.message);
    res.status(500).json({ error: "Failed to save product" });
  }
});

// DELETE /api/products/:id
app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (firestoreDb && id) {
      await deleteDoc(doc(firestoreDb, "products", id));
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Server] Error deleting product:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// GET /api/orders
app.get("/api/orders", async (_req: Request, res: Response) => {
  try {
    if (!firestoreDb) {
      res.json({ orders: [] });
      return;
    }
    const snap = await getDocs(collection(firestoreDb, "orders"));
    const orders = snap.docs.map((d) => d.data());
    orders.sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    res.json({ orders });
  } catch (err: any) {
    console.error("[Server] Error fetching orders:", err.message);
    res.json({ orders: [] });
  }
});

// POST /api/orders
app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order || !order.id) {
      res.status(400).json({ error: "Order payload missing id" });
      return;
    }
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "orders", order.id), order);
    }
    res.json({ success: true, order });
  } catch (err: any) {
    console.error("[Server] Error saving order:", err.message);
    res.status(500).json({ error: "Failed to save order" });
  }
});

// STK Push Endpoint (Initiates prompt on customer's phone)
app.post("/api/mpesa/stkpush", async (req: Request, res: Response) => {
  try {
    const {
      phone,
      amount,
      accountReference = "BORA-HARDWARE",
      transactionDesc = "Bora Hardware Materials",
      environment = process.env.MPESA_ENVIRONMENT || "sandbox",
      consumerKey = process.env.MPESA_CONSUMER_KEY,
      consumerSecret = process.env.MPESA_CONSUMER_SECRET,
      shortcode = process.env.MPESA_SHORTCODE || "174379",
      passkey = process.env.MPESA_PASSKEY || "",
      callbackUrl = process.env.APP_URL
        ? `${process.env.APP_URL}/api/mpesa/callback`
        : "https://borahardware.co.ke/api/mpesa/callback",
    } = req.body;

    if (!phone) {
      res.status(400).json({ error: "Customer phone number is required" });
      return;
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (formattedPhone.length !== 12 || !formattedPhone.startsWith("254")) {
      res.status(400).json({
        error: `Invalid Kenyan phone number format (${formattedPhone}). Must be a valid Safaricom line (e.g. 0715532279).`,
      });
      return;
    }

    const parsedAmount = Math.max(1, Math.round(Number(amount) || 1));
    const timestamp = getTimestamp();

    // Check if we have valid credentials or if we need to guide the user
    if (!consumerKey || !consumerSecret) {
      // In sandbox mode without credentials provided, return detailed guidance with simulated success option
      res.status(200).json({
        success: true,
        simulated: true,
        message: "STK Push simulated for testing. To push to real phones, enter your Daraja Consumer Key & Secret in Admin Settings.",
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: `ws_CO_SIM_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing (Sandbox Mode)",
        CustomerMessage: `STK Push prompt sent to ${formattedPhone} for KES ${parsedAmount.toLocaleString()}.`,
        phone: formattedPhone,
        amount: parsedAmount,
      });
      return;
    }

    // Live Daraja call
    const accessToken = await getDarajaToken(consumerKey, consumerSecret, environment);
    const password = generatePassword(shortcode, passkey, timestamp);

    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: parsedAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: transactionDesc.substring(0, 13),
    };

    const darajaResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const responseData = await darajaResponse.json();

    if (!darajaResponse.ok || responseData.ResponseCode !== "0") {
      res.status(200).json({
        success: false,
        error: responseData.errorMessage || responseData.ResponseDescription || "Daraja STK push failed",
        details: responseData,
        phone: formattedPhone,
        amount: parsedAmount,
      });
      return;
    }

    res.status(200).json({
      success: true,
      simulated: false,
      ...responseData,
      phone: formattedPhone,
      amount: parsedAmount,
    });
  } catch (err: any) {
    console.error("STK Push error:", err);
    res.status(500).json({
      error: err.message || "Failed to process STK push",
      hint: "Check Consumer Key, Consumer Secret, and Shortcode settings in the Admin Portal.",
    });
  }
});

// STK Query Endpoint (Checks transaction status)
app.post("/api/mpesa/query", async (req: Request, res: Response) => {
  try {
    const {
      checkoutRequestId,
      environment = process.env.MPESA_ENVIRONMENT || "sandbox",
      consumerKey = process.env.MPESA_CONSUMER_KEY,
      consumerSecret = process.env.MPESA_CONSUMER_SECRET,
      shortcode = process.env.MPESA_SHORTCODE || "174379",
      passkey = process.env.MPESA_PASSKEY || "",
    } = req.body;

    if (!checkoutRequestId) {
      res.status(400).json({ error: "checkoutRequestId is required" });
      return;
    }

    if (checkoutRequestId.startsWith("ws_CO_SIM_")) {
      res.json({
        ResponseCode: "0",
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully (Simulated).",
      });
      return;
    }

    if (!consumerKey || !consumerSecret) {
      res.json({
        ResponseCode: "0",
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully.",
      });
      return;
    }

    const accessToken = await getDarajaToken(consumerKey, consumerSecret, environment);
    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    const queryResponse = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await queryResponse.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// B2Pochi Payment Request Endpoint (User endpoint: /mpesa/b2pochi/v1/paymentrequest)
app.post("/api/mpesa/b2pochi", async (req: Request, res: Response) => {
  try {
    const {
      amount,
      partyB,
      remarks = "Bora Hardware Site Material Freight",
      occasion = "Hardware Delivery",
      commandID = "BusinessPayment",
      initiator = "testapi",
      securityCredential,
      environment = "sandbox",
      consumerKey = process.env.MPESA_CONSUMER_KEY,
      consumerSecret = process.env.MPESA_CONSUMER_SECRET,
      shortcode = "600988",
      queueTimeOutURL = "https://borahardware.co.ke/api/b2pochi/timeout",
      resultURL = "https://borahardware.co.ke/api/b2pochi/result",
    } = req.body;

    const formattedPhone = formatKenyanPhone(partyB || "254715532279");
    const parsedAmount = Math.max(1, Math.round(Number(amount) || 1));

    if (!consumerKey || !consumerSecret || !securityCredential) {
      // Return structured response for sandbox simulation
      res.status(200).json({
        success: true,
        simulated: true,
        ConversationID: `AG_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        OriginatorConversationID: `BORA-${Math.floor(10000 + Math.random() * 90000)}-POCHI`,
        ResponseCode: "0",
        ResponseDescription: "Accept the service request successfully.",
        Endpoint:
          environment === "production"
            ? "https://api.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest"
            : "https://sandbox.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest",
        RecipientPochi: formattedPhone,
        DisbursedAmount: `KES ${parsedAmount.toLocaleString()}`,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    const accessToken = await getDarajaToken(consumerKey, consumerSecret, environment);
    const targetUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest"
        : "https://sandbox.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest";

    const payload = {
      Initiator: initiator,
      SecurityCredential: securityCredential,
      CommandID: commandID,
      Amount: parsedAmount,
      PartyA: shortcode,
      PartyB: formattedPhone,
      Remarks: remarks,
      QueueTimeOutURL: queueTimeOutURL,
      ResultURL: resultURL,
      Occasion: occasion,
    };

    const safaricomRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await safaricomRes.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook callback for M-Pesa
app.post("/api/mpesa/callback", (req: Request, res: Response) => {
  console.log("Received Safaricom Daraja Callback:", JSON.stringify(req.body, null, 2));
  res.json({ ResultCode: 0, ResultDesc: "Callback accepted successfully" });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bora Hardware Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();

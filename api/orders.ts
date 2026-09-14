import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firestoreDb: any = null;

function getDb() {
  if (firestoreDb) return firestoreDb;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = getApps().length > 0 ? getApp() : initializeApp(config);
      const dbId = config.firestoreDatabaseId || '(default)';
      firestoreDb = getFirestore(app, dbId);
    }
  } catch (err) {
    console.warn('[Vercel API /orders] Firestore init error:', err);
  }
  return firestoreDb;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  if (req.method === 'GET') {
    try {
      if (!db) {
        return res.status(200).json({ orders: [] });
      }
      const snap = await getDocs(collection(db, 'orders'));
      const orders = snap.docs.map((d) => d.data());
      orders.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.status(200).json({ orders });
    } catch (err: any) {
      console.error('[API] /api/orders GET error:', err);
      return res.status(200).json({ orders: [] });
    }
  }

  if (req.method === 'POST') {
    try {
      const order = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!order || !order.id || !order.customerName) {
        return res.status(400).json({ error: 'Missing order data' });
      }
      if (db) {
        await setDoc(doc(db, 'orders', order.id), order, { merge: true });
      }
      return res.status(200).json({ success: true, order });
    } catch (err: any) {
      console.error('[API] /api/orders POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { INITIAL_PRODUCTS } from '../src/data/initialProducts';
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
    console.warn('[Vercel API /products] Firestore init error:', err);
  }
  return firestoreDb;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  if (req.method === 'GET') {
    try {
      if (!db) {
        return res.status(200).json({ products: INITIAL_PRODUCTS });
      }
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty) {
        // Seed initial products
        for (const prod of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', prod.id), prod);
        }
        return res.status(200).json({ products: INITIAL_PRODUCTS });
      }
      const products = snap.docs.map((d) => d.data());
      return res.status(200).json({ products });
    } catch (err: any) {
      console.error('[API] /api/products GET error:', err);
      return res.status(200).json({ products: INITIAL_PRODUCTS });
    }
  }

  if (req.method === 'POST') {
    try {
      const product = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!product || !product.id || !product.name) {
        return res.status(400).json({ error: 'Missing product data' });
      }
      if (db) {
        await setDoc(doc(db, 'products', product.id), product, { merge: true });
      }
      return res.status(200).json({ success: true, product });
    } catch (err: any) {
      console.error('[API] /api/products POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id || (typeof req.body === 'string' ? JSON.parse(req.body || '{}').id : req.body?.id);
      if (!id) {
        return res.status(400).json({ error: 'Missing product id' });
      }
      if (db) {
        await deleteDoc(doc(db, 'products', id));
      }
      return res.status(200).json({ success: true, deleted: id });
    } catch (err: any) {
      console.error('[API] /api/products DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

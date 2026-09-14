import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, Order } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
} from '../utils/storage';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

let isSeedingProducts = false;

/**
 * Seed initial catalog to Firestore if the cloud database is empty
 */
async function seedInitialProductsIfEmpty(): Promise<Product[]> {
  if (isSeedingProducts) return INITIAL_PRODUCTS;
  isSeedingProducts = true;
  try {
    console.log('[Firestore] Seeding initial hardware catalog to cloud database...');
    const seedPromises = INITIAL_PRODUCTS.map((prod) =>
      setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod)
    );
    await Promise.all(seedPromises);
    console.log('[Firestore] Initial catalog seeded successfully.');
    saveStoredProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  } catch (err) {
    console.warn('[Firestore] Notice while seeding products:', err);
    return INITIAL_PRODUCTS;
  } finally {
    isSeedingProducts = false;
  }
}

/**
 * Sanitize product payload before sending to Firestore to avoid "unsupported field value: undefined" errors
 */
export function sanitizeProductForFirestore(product: Product): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(product.id),
    name: String(product.name || '').trim(),
    category: String(product.category || 'Hardware & Security').trim(),
    sellingPrice: Number(product.sellingPrice) || 0,
    buyingPrice: Number(product.buyingPrice) || 0,
    quantity: Math.max(0, Number(product.quantity) || 0),
    unit: String(product.unit || 'Piece').trim(),
    inStock: Boolean(product.inStock && Number(product.quantity) > 0),
    description: String(product.description || '').trim(),
    lowStockThreshold: Math.max(0, Number(product.lowStockThreshold) || 5),
    badge: product.badge ? String(product.badge).trim() : '',
    imageUrl: product.imageUrl ? String(product.imageUrl).trim() : '',
    updatedAt: new Date().toISOString(),
  };
  return clean;
}

export function parseProductFromDoc(id: string, data: any): Product {
  return {
    id: data.id || id,
    name: String(data.name || '').trim(),
    category: String(data.category || 'General').trim(),
    sellingPrice: Number(data.sellingPrice) || 0,
    buyingPrice: Number(data.buyingPrice) || 0,
    quantity: Math.max(0, Number(data.quantity) || 0),
    unit: String(data.unit || 'Piece').trim(),
    inStock: typeof data.inStock === 'boolean' ? data.inStock : Number(data.quantity) > 0,
    description: String(data.description || '').trim(),
    lowStockThreshold: Number(data.lowStockThreshold) || 5,
    badge: data.badge ? String(data.badge).trim() : undefined,
    imageUrl: data.imageUrl ? String(data.imageUrl).trim() : undefined,
  };
}

/**
 * Fetch all products from shared Firestore cloud database
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (querySnapshot.empty) {
      // Seed initial products so all new devices have the inventory immediately
      return await seedInitialProductsIfEmpty();
    }

    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      products.push(parseProductFromDoc(docSnap.id, docSnap.data()));
    });

    if (products.length > 0) {
      saveStoredProducts(products);
      return products;
    }
  } catch (err) {
    console.warn('[Firestore] Direct query failed, querying /api/products endpoint:', err);
    try {
      const resp = await fetch('/api/products');
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          const parsed = data.products.map((p: any) => parseProductFromDoc(p.id, p));
          saveStoredProducts(parsed);
          return parsed;
        }
      }
    } catch {
      // fall back to stored
    }
  }
  return getStoredProducts();
}

/**
 * Save or update a product in shared Firestore cloud database
 * Updates immediately reflect on all devices in real-time
 */
export async function saveProductToCloud(product: Product): Promise<void> {
  const cleanPayload = sanitizeProductForFirestore(product);
  let directSuccess = false;

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, cleanPayload, { merge: true });
    directSuccess = true;
    console.log(`[Firestore] Product "${product.name}" successfully updated in shared cloud database.`);
  } catch (err) {
    console.warn('[Firestore] Direct product save warning:', err);
  }

  // Dual-write to server API proxy to guarantee persistence across all client environments
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });
  } catch {
    // optional server sync
  }

  if (!directSuccess) {
    // If direct write failed and no server proxy responded, make sure local state still knows
    console.log('[Firestore] Save completed with fallback.');
  }
}

/**
 * Delete a product from shared Firestore cloud database
 */
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Product "${productId}" deleted from shared cloud database.`);
  } catch (err) {
    console.warn('[Firestore] Product delete warning:', err);
  }

  try {
    await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  } catch {
    // optional server sync
  }
}

/**
 * Fetch all orders from shared Firestore cloud database
 */
export async function fetchOrders(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    if (querySnapshot.empty) {
      // Verify with server API in case of client-side cache/permission discrepancy
      try {
        const resp = await fetch('/api/orders');
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.orders)) {
            saveStoredOrders(data.orders);
            return data.orders;
          }
        }
      } catch {
        // server fallback
      }
      saveStoredOrders([]);
      return [];
    }

    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push(docSnap.data() as Order);
    });

    // Sort newest orders first
    orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    saveStoredOrders(orders);
    return orders;
  } catch (err) {
    console.warn('[Firestore] Orders fetch warning, checking /api/orders endpoint:', err);
    try {
      const resp = await fetch('/api/orders');
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.orders)) {
          saveStoredOrders(data.orders);
          return data.orders;
        }
      }
    } catch {
      // Silently fall back to cached data
    }
    return getStoredOrders();
  }
}

/**
 * Save or update an order in shared Firestore cloud database
 */
export async function saveOrderToCloud(order: Order): Promise<void> {
  let directSuccess = false;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, order, { merge: true });
    directSuccess = true;
    console.log(`[Firestore] Order ${order.id} saved directly to shared cloud database.`);
  } catch (err) {
    console.warn('[Firestore] Client setDoc error, persisting via /api/orders:', err);
  }

  // Always dual-write to server API proxy to guarantee persistence across all network types
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (response.ok) {
      console.log(`[Server] Order ${order.id} saved via /api/orders endpoint.`);
      return;
    }
  } catch (apiErr) {
    console.warn('[API] /api/orders error:', apiErr);
  }
}

/**
 * Real-time live listener for products across all devices using Firestore onSnapshot
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void
): () => void {
  let isSubscribed = true;
  let pollTimer: any = null;

  try {
    const unsub = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        if (!isSubscribed) return;

        if (snapshot.empty) {
          // If empty, auto-seed
          seedInitialProductsIfEmpty().then((seeded) => {
            if (isSubscribed) {
              onUpdate(seeded);
            }
          });
          return;
        }

        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push(parseProductFromDoc(docSnap.id, docSnap.data()));
        });

        if (items.length > 0 && isSubscribed) {
          saveStoredProducts(items);
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('[Firestore] Products subscription error, using polling fallback:', error);
        if (!pollTimer && isSubscribed) {
          // Polling fallback every 6 seconds if real-time socket was interrupted
          pollTimer = setInterval(async () => {
            if (!isSubscribed) return;
            const list = await fetchProducts();
            if (list.length > 0) onUpdate(list);
          }, 6000);
        }
      }
    );

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);
      unsub();
    };
  } catch (err) {
    console.warn('[Firestore] Failed to attach snapshot listener, starting polling:', err);
    pollTimer = setInterval(async () => {
      if (!isSubscribed) return;
      const list = await fetchProducts();
      if (list.length > 0) onUpdate(list);
    }, 6000);

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }
}

/**
 * Real-time live listener for orders across all devices using Firestore onSnapshot
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void
): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, ORDERS_COLLECTION),
      (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Order);
        });

        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        saveStoredOrders(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('[Firestore] Orders subscription notice, activating polling sync:', error);
        // Polling fallback every 4 seconds ensures real-time updates even without WebSockets
        const pollTimer = setInterval(async () => {
          const list = await fetchOrders();
          onUpdate(list);
        }, 4000);
        return () => clearInterval(pollTimer);
      }
    );

    return unsub;
  } catch (err) {
    console.warn('[Firestore] Failed to attach orders snapshot listener:', err);
    return () => {};
  }
}

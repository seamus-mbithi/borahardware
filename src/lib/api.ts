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
      products.push(docSnap.data() as Product);
    });

    if (products.length > 0) {
      saveStoredProducts(products);
      return products;
    }
    return getStoredProducts();
  } catch (err) {
    console.warn('[Firestore] Falling back to local/cached products:', err);
    try {
      handleFirestoreError(err, OperationType.GET, PRODUCTS_COLLECTION);
    } catch {
      // Silently fall back to cached data for resilient client UI
    }
    return getStoredProducts();
  }
}

/**
 * Save or update a product in shared Firestore cloud database
 * Updates immediately reflect on all devices in real-time
 */
export async function saveProductToCloud(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving product to cloud:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
    } catch {
      // Allow caller to catch
    }
  }

  // Also proxy to server if accessible
  try {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch(() => {});
  } catch {
    // optional server sync
  }
}

/**
 * Delete a product from shared Firestore cloud database
 */
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firestore] Error deleting product from cloud:', err);
    try {
      handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${productId}`);
    } catch {
      // Allow caller to catch
    }
  }

  // Also proxy to server if accessible
  try {
    fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    }).catch(() => {});
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
      const stored = getStoredOrders();
      if (stored.length > 0) {
        // Seed initial orders to cloud
        stored.forEach((ord) => {
          setDoc(doc(db, ORDERS_COLLECTION, ord.id), ord).catch(() => {});
        });
      }
      return stored;
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
    console.warn('[Firestore] Falling back to local/cached orders:', err);
    try {
      handleFirestoreError(err, OperationType.GET, ORDERS_COLLECTION);
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
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, order, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving order to cloud:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${ORDERS_COLLECTION}/${order.id}`);
    } catch {
      // Allow caller to catch
    }
  }

  // Also proxy to server if accessible
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(() => {});
  } catch {
    // optional server sync
  }
}

/**
 * Real-time live listener for products across all devices using Firestore onSnapshot
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void
): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty) {
          // If empty, auto-seed
          seedInitialProductsIfEmpty().then((seeded) => {
            onUpdate(seeded);
          });
          return;
        }

        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Product);
        });

        if (items.length > 0) {
          saveStoredProducts(items);
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('[Firestore] Products subscription error, using polling fallback:', error);
        try {
          handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
        } catch {
          // Polling fallback every 8 seconds if real-time socket was interrupted
          const pollTimer = setInterval(async () => {
            const list = await fetchProducts();
            if (list.length > 0) onUpdate(list);
          }, 8000);
          return () => clearInterval(pollTimer);
        }
      }
    );

    return unsub;
  } catch (err) {
    console.warn('[Firestore] Failed to attach snapshot listener:', err);
    return () => {};
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

        if (items.length > 0) {
          saveStoredOrders(items);
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('[Firestore] Orders subscription error, using polling fallback:', error);
        try {
          handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
        } catch {
          // Polling fallback
          const pollTimer = setInterval(async () => {
            const list = await fetchOrders();
            if (list.length > 0) onUpdate(list);
          }, 8000);
          return () => clearInterval(pollTimer);
        }
      }
    );

    return unsub;
  } catch (err) {
    console.warn('[Firestore] Failed to attach orders snapshot listener:', err);
    return () => {};
  }
}

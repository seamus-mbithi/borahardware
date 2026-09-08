import { Product, Order } from '../types';

// Fetch all products from server
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.warn('[API] Failed to fetch products from server, using local data:', err);
    return [];
  }
}

// Save or update a product via server
export async function saveProductToCloud(product: Product): Promise<void> {
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  } catch (err) {
    console.warn('[API] Notice saving product to cloud:', err);
  }
}

// Delete a product via server
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[API] Notice deleting product from cloud:', err);
  }
}

// Fetch all orders from server
export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.orders) ? data.orders : [];
  } catch (err) {
    console.warn('[API] Failed to fetch orders from server, using local data:', err);
    return [];
  }
}

// Save or update an order via server
export async function saveOrderToCloud(order: Order): Promise<void> {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (err) {
    console.warn('[API] Notice saving order to cloud:', err);
  }
}

// Live polling synchronization for products without exposing API keys in client
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  intervalMs: number = 8000
): () => void {
  let active = true;

  const check = async () => {
    if (!active) return;
    try {
      const list = await fetchProducts();
      if (active && list.length > 0) {
        onUpdate(list);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  // Initial call
  check();
  const timer = setInterval(check, intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// Live polling synchronization for orders without exposing API keys in client
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  intervalMs: number = 8000
): () => void {
  let active = true;

  const check = async () => {
    if (!active) return;
    try {
      const list = await fetchOrders();
      if (active && list.length > 0) {
        onUpdate(list);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  // Initial call
  check();
  const timer = setInterval(check, intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

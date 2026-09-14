import { Product, Order, DarajaConfig } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_KEY = 'bora_hardware_products_v2';
const ORDERS_KEY = 'bora_hardware_orders_v2';
const ADMIN_SESSION_KEY = 'bora_admin_logged_in_v2';
const DARAJA_CONFIG_KEY = 'bora_daraja_config_v2';

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    // Merge any missing initial image URLs if not present
    const merged = parsed.map((p: Product) => {
      if (!p.imageUrl) {
        const init = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
        if (init?.imageUrl) {
          return { ...p, imageUrl: init.imageUrl };
        }
      }
      return p;
    });
    return merged;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders:', err);
  }
}

/**
 * Updates order status and automatically manages stock subtraction / restoration.
 */
export function updateOrderStatusAndStock(
  orderId: string,
  newStatus: 'pending' | 'confirmed' | 'cancelled',
  currentProducts: Product[],
  currentOrders: Order[]
): { updatedProducts: Product[]; updatedOrders: Order[] } {
  let updatedProducts = [...currentProducts];
  const updatedOrders = currentOrders.map((ord) => {
    if (ord.id !== orderId) return ord;

    const wasDeducted = ord.stockDeducted;

    // Moving TO 'confirmed' and stock wasn't deducted yet -> SUBTRACT
    if (newStatus === 'confirmed' && !wasDeducted) {
      updatedProducts = updatedProducts.map((prod) => {
        const matchingItem = ord.items.find((item) => item.productId === prod.id);
        if (matchingItem) {
          const newQty = Math.max(0, prod.quantity - matchingItem.quantity);
          return {
            ...prod,
            quantity: newQty,
            inStock: newQty > 0,
          };
        }
        return prod;
      });
      return {
        ...ord,
        status: newStatus,
        stockDeducted: true,
      };
    }

    // Moving FROM 'confirmed' TO 'cancelled' (or 'pending') when stock was deducted -> RESTORE
    if (newStatus !== 'confirmed' && wasDeducted) {
      updatedProducts = updatedProducts.map((prod) => {
        const matchingItem = ord.items.find((item) => item.productId === prod.id);
        if (matchingItem) {
          const newQty = prod.quantity + matchingItem.quantity;
          return {
            ...prod,
            quantity: newQty,
            inStock: true,
          };
        }
        return prod;
      });
      return {
        ...ord,
        status: newStatus,
        stockDeducted: false,
      };
    }

    return {
      ...ord,
      status: newStatus,
    };
  });

  saveStoredProducts(updatedProducts);
  saveStoredOrders(updatedOrders);

  return { updatedProducts, updatedOrders };
}

export function getAdminSession(): boolean {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminSession(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to set admin session:', err);
  }
}

export const DEFAULT_DARAJA_CONFIG: DarajaConfig = {
  shortcode: '174379',
  tillOrPaybill: 'Till Number',
  accountReference: 'BORA-HARDWARE',
  consumerKey: '',
  consumerSecret: '',
  passkey: '',
  environment: 'sandbox',
  isActive: false,
  b2pochiEndpoint: 'https://sandbox.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest',
  initiatorName: 'testapi',
  securityCredential: '',
  pochiPhone: '254715532279',
  commandID: 'BusinessPayment',
  queueTimeOutUrl: 'https://borahardware.co.ke/api/mpesa/b2pochi/timeout',
  resultUrl: 'https://borahardware.co.ke/api/mpesa/b2pochi/result',
};

export function getDarajaConfig(): DarajaConfig {
  try {
    const raw = localStorage.getItem(DARAJA_CONFIG_KEY);
    if (!raw) return DEFAULT_DARAJA_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DARAJA_CONFIG, ...parsed };
  } catch {
    return DEFAULT_DARAJA_CONFIG;
  }
}

export function saveDarajaConfig(config: DarajaConfig): void {
  try {
    localStorage.setItem(DARAJA_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Daraja config:', err);
  }
}

export function formatKES(amount: number): string {
  return 'KSh ' + Math.round(amount).toLocaleString('en-KE');
}

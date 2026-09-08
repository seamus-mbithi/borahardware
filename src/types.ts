export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number; // in KSh (KES)
  buyingPrice: number; // in KSh (KES)
  quantity: number; // units available
  unit: string; // e.g. "50kg Bag", "3m Sheet", "Piece"
  inStock: boolean;
  description: string;
  lowStockThreshold: number;
  badge?: string;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice: number;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryLocation?: string;
  orderType: 'whatsapp' | 'cart_checkout' | 'mpesa_direct';
  items: OrderItem[];
  subtotal: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  stockDeducted: boolean;
  createdAt: string;
  notes?: string;
  paymentRef?: string;
}

export interface DarajaConfig {
  shortcode: string;
  tillOrPaybill: 'Till Number' | 'Paybill' | 'Pochi la Biashara';
  accountReference: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  environment: 'sandbox' | 'production';
  isActive: boolean;
  // B2Pochi Payment Request API configuration
  b2pochiEndpoint: string;
  initiatorName: string;
  securityCredential: string;
  pochiPhone: string;
  commandID: 'BusinessPayment' | 'CustomerPayment' | 'SalaryPayment' | 'PromotionPayment';
  queueTimeOutUrl: string;
  resultUrl: string;
}

import React, { useState, useMemo } from 'react';
import { CartItem, Order, Product } from '../types';
import { formatKES, getDarajaConfig } from '../utils/storage';
import { STORE_INFO } from '../data/initialProducts';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MessageSquare,
  ShoppingBag,
  MapPin,
  User,
  Phone,
  CheckCircle,
  CreditCard,
  Truck,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Sparkles,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  availableProducts?: Product[];
  onAddToCart?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  availableProducts = [],
  onAddToCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // M-Pesa direct checkout state
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaSubTab, setMpesaSubTab] = useState<'stk' | 'pochi'>('stk');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [pochiCode, setPochiCode] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'prompting' | 'success'>('idle');
  const [stkError, setStkError] = useState<string | null>(null);
  const [stkSuccessMessage, setStkSuccessMessage] = useState<string | null>(null);
  const [isWaitingForPin, setIsWaitingForPin] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  // Items in store not currently in the cart to help customer add forgotten products
  const forgottenItems = useMemo(() => {
    const inCartIds = new Set(cart.map((c) => c.product.id));
    return availableProducts
      .filter((p) => !inCartIds.has(p.id) && p.inStock && p.quantity > 0)
      .slice(0, 6);
  }, [availableProducts, cart]);

  const handleContinueShopping = () => {
    onClose();
    setTimeout(() => {
      const catalog = document.getElementById('catalog-section');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  const generateOrderId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `BORA-${randomNum}`;
  };

  const handleWhatsAppCheckout = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter your Name and Phone Number to complete WhatsApp checkout.');
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);

    const orderId = generateOrderId();
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      unit: item.product.unit,
      quantity: item.quantity,
      sellingPrice: item.product.sellingPrice,
      buyingPrice: item.product.buyingPrice,
      total: item.product.sellingPrice * item.quantity,
    }));

    const newOrder: Order = {
      id: orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryLocation: deliveryLocation.trim() || 'Store Pickup / Site Delivery',
      orderType: 'whatsapp',
      items: orderItems,
      subtotal: totalAmount,
      status: 'pending',
      stockDeducted: false,
      createdAt: new Date().toISOString(),
      notes: notes.trim(),
    };

    // Construct WhatsApp message with formatted line items
    let msg = `*NEW ORDER - BORA HARDWARE*\n`;
    msg += `Ref: *${orderId}*\n`;
    msg += `Customer: *${customerName.trim()}*\n`;
    msg += `Phone: *${customerPhone.trim()}*\n`;
    if (deliveryLocation.trim()) {
      msg += `Site/Location: *${deliveryLocation.trim()}*\n`;
    }
    msg += `\n*ITEMS ORDERED:*\n`;

    cart.forEach((item, idx) => {
      const lineTotal = item.product.sellingPrice * item.quantity;
      msg += `${idx + 1}. *${item.product.name}*\n`;
      msg += `   Qty: ${item.quantity} ${item.product.unit} @ ${formatKES(item.product.sellingPrice)} = *${formatKES(lineTotal)}*\n`;
    });

    msg += `\n*TOTAL AMOUNT: ${formatKES(totalAmount)}*\n`;

    if (notes.trim()) {
      msg += `Notes: ${notes.trim()}\n`;
    }

    msg += `\nHello Bora Hardware, please confirm material availability and delivery arrangement.`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${STORE_INFO.cleanPhone}?text=${encodedMsg}`;

    // Record order in state and storage
    onOrderPlaced(newOrder);
    setOrderSuccess(newOrder);
    onClearCart();
    setIsSubmitting(false);

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleMpesaTrigger = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and phone number first.');
      return;
    }
    setMpesaPhone(customerPhone.trim());
    setShowMpesaModal(true);
  };

  const handleExecuteMpesaSTK = async () => {
    if (!mpesaPhone.trim()) {
      alert('Please enter a valid Safaricom phone number (e.g. 07XXXXXXXX)');
      return;
    }
    setMpesaStatus('prompting');
    setStkError(null);
    setStkSuccessMessage(null);

    try {
      const darajaConfig = getDarajaConfig();
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: mpesaPhone.trim(),
          amount: totalAmount,
          accountReference: darajaConfig.accountReference || 'BORA-HW',
          transactionDesc: 'Bora Hardware Materials',
          environment: darajaConfig.environment,
          shortcode: darajaConfig.shortcode,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setMpesaStatus('idle');
        setStkError(
          data.error ||
            data.ResponseDescription ||
            'Failed to send STK Push. Please verify your phone number.'
        );
        return;
      }

      // Successful prompt dispatch to customer phone
      setCheckoutRequestId(data.CheckoutRequestID || null);
      setStkSuccessMessage(
        data.CustomerMessage ||
          `STK Push sent to ${data.phone || mpesaPhone}! Please enter your M-Pesa PIN on your phone.`
      );
      setIsWaitingForPin(true);
      setMpesaStatus('idle');
    } catch (err: any) {
      setMpesaStatus('idle');
      setStkError(
        err.message || 'Unable to connect to M-Pesa gateway. Please check your connection.'
      );
    }
  };

  const handleConfirmOrderAfterPin = () => {
    setMpesaStatus('prompting');

    setTimeout(() => {
      const orderId = generateOrderId();
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        buyingPrice: item.product.buyingPrice,
        total: item.product.sellingPrice * item.quantity,
      }));

      const newOrder: Order = {
        id: orderId,
        customerName: customerName.trim(),
        customerPhone: mpesaPhone.trim() || customerPhone.trim(),
        deliveryLocation: deliveryLocation.trim() || 'Store Pickup / Site Delivery',
        orderType: 'mpesa_direct',
        items: orderItems,
        subtotal: totalAmount,
        status: 'pending',
        stockDeducted: false,
        createdAt: new Date().toISOString(),
        paymentRef: checkoutRequestId || `MPESA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        notes: `M-Pesa STK Push accepted for ${formatKES(totalAmount)}. ${notes.trim()}`,
      };

      setMpesaStatus('success');
      setTimeout(() => {
        onOrderPlaced(newOrder);
        setOrderSuccess(newOrder);
        setShowMpesaModal(false);
        setMpesaStatus('idle');
        setIsWaitingForPin(false);
        setCheckoutRequestId(null);
        setStkSuccessMessage(null);
        onClearCart();
      }, 1000);
    }, 1000);
  };

  const handleExecutePochiPayment = () => {
    if (!pochiCode.trim()) {
      alert('Please enter the M-Pesa transaction confirmation code from Safaricom SMS (e.g. SH12AB34CD).');
      return;
    }

    setMpesaStatus('prompting');

    setTimeout(() => {
      const orderId = generateOrderId();
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        buyingPrice: item.product.buyingPrice,
        total: item.product.sellingPrice * item.quantity,
      }));

      const newOrder: Order = {
        id: orderId,
        customerName: customerName.trim(),
        customerPhone: mpesaPhone.trim() || customerPhone.trim(),
        deliveryLocation: deliveryLocation.trim() || 'Store Pickup / Site Delivery',
        orderType: 'mpesa_direct',
        items: orderItems,
        subtotal: totalAmount,
        status: 'pending',
        stockDeducted: false,
        createdAt: new Date().toISOString(),
        paymentRef: pochiCode.trim().toUpperCase(),
        notes: `Paid via Pochi la Biashara to ${STORE_INFO.whatsappNumber} (Ref: ${pochiCode.trim().toUpperCase()}). ${notes.trim()}`,
      };

      setMpesaStatus('success');
      setTimeout(() => {
        onOrderPlaced(newOrder);
        setOrderSuccess(newOrder);
        setShowMpesaModal(false);
        setMpesaStatus('idle');
        setPochiCode('');
        onClearCart();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-lg text-stone-950">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Your Hardware Cart</h2>
              <p className="text-xs text-stone-400">
                {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} ready for checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleContinueShopping}
              id="cart-header-continue-shopping-btn"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition-colors border border-stone-700"
              title="Keep browsing products in store"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Continue Shopping</span>
              <span className="sm:hidden">Keep Shopping</span>
            </button>
            <button
              onClick={onClose}
              id="cart-drawer-close-btn"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Success Screen */}
        {orderSuccess ? (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Order Dispatched!</h3>
            <p className="text-sm text-stone-600 mt-1 max-w-sm">
              Your order ref <strong className="text-stone-900 font-mono">{orderSuccess.id}</strong> has been created.
            </p>

            <div className="w-full max-w-sm mt-5 p-4 bg-stone-50 border border-stone-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-800">{orderSuccess.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <span className="font-semibold text-stone-800">{orderSuccess.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total:</span>
                <span className="font-bold text-stone-950 text-sm">{formatKES(orderSuccess.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status:</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">
                  Logged in Bora Store
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500 mt-4 max-w-xs">
              If WhatsApp did not open automatically, contact Mbithi on{' '}
              <strong className="text-stone-800">{STORE_INFO.whatsappNumber}</strong>.
            </p>

            <button
              onClick={() => {
                setOrderSuccess(null);
                onClose();
              }}
              id="continue-shopping-success-btn"
              className="mt-6 w-full max-w-xs bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 stroke-1" />
            </div>
            <h3 className="text-base font-bold text-stone-800">Your cart is currently empty</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Select building materials like Simba Cement 50kg, steel rebar, and roofing sheets to start your order.
            </p>
            <button
              onClick={onClose}
              id="empty-cart-browse-btn"
              className="mt-5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Active Cart with Items */
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {/* Items List */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider pb-1">
                <span>Selected Items</span>
                <button
                  onClick={onClearCart}
                  id="cart-clear-all-btn"
                  className="text-stone-400 hover:text-red-600 transition-colors"
                >
                  Clear Cart
                </button>
              </div>

              {cart.map(({ product, quantity }) => {
                const lineTotal = product.sellingPrice * quantity;
                const canIncrease = quantity < product.quantity;

                return (
                  <div
                    key={product.id}
                    id={`cart-item-${product.id}`}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {product.name}
                      </h4>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <span>{formatKES(product.sellingPrice)}</span>
                        <span>/ {product.unit}</span>
                      </div>
                      <div className="text-xs font-semibold text-stone-800 mt-1">
                        Subtotal: <span className="text-amber-800">{formatKES(lineTotal)}</span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white shadow-xs">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          id={`qty-decrease-${product.id}`}
                          className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-l-lg transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          disabled={!canIncrease}
                          id={`qty-increase-${product.id}`}
                          className={`p-1.5 rounded-r-lg transition-colors ${
                            canIncrease
                              ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                              : 'text-stone-300 cursor-not-allowed'
                          }`}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(product.id)}
                        id={`cart-remove-${product.id}`}
                        className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Forgotten Products / Quick Add Section */}
            {forgottenItems.length > 0 && (
              <div className="p-4 sm:p-5 bg-amber-50/70 border-t border-amber-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Forgot anything for your site?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinueShopping}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5"
                  >
                    <span>Browse all</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-amber-900/80 mb-3">
                  Quickly add common building essentials directly to your order:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {forgottenItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-stone-500 flex items-center gap-1">
                          <span className="font-semibold text-amber-800">{formatKES(prod.sellingPrice)}</span>
                          <span>•</span>
                          <span>{prod.unit}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddToCart) {
                            onAddToCart(prod);
                          } else {
                            onUpdateQuantity(prod.id, 1);
                          }
                        }}
                        id={`quick-add-forgotten-${prod.id}`}
                        className="shrink-0 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-md flex items-center gap-1 shadow-xs transition-all active:scale-95"
                        title={`Add ${prod.name} to cart`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Details Form */}
            <div className="p-4 sm:p-5 bg-stone-50/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Customer & Delivery Details</span>
              </h4>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Samuel Mutua / Site Contractor"
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    id="cart-customer-name"
                  />
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Phone / WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    id="cart-customer-phone"
                  />
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Delivery Site / Drop Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Joska Site Stage 2, Ruai, or Store Pickup"
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    id="cart-delivery-location"
                  />
                  <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Order Instructions (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Need offloading assistance, morning delivery preferred"
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 text-stone-900 focus:outline-none focus:border-amber-500"
                  id="cart-order-notes"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer with Totals and Dual Checkout Buttons */}
        {!orderSuccess && cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-stone-200 shadow-lg space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-500 font-medium">Estimated Total</span>
                <p className="text-2xl font-black text-stone-950 tracking-tight">
                  {formatKES(totalAmount)}
                </p>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Incl. Local Hardware Taxes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* WhatsApp Checkout (Primary) */}
              <button
                onClick={handleWhatsAppCheckout}
                disabled={isSubmitting}
                id="cart-checkout-whatsapp-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>

              {/* M-Pesa Direct Checkout */}
              <button
                onClick={handleMpesaTrigger}
                id="cart-checkout-mpesa-btn"
                className="w-full bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-800 shadow-md transition-all active:scale-98"
              >
                <CreditCard className="w-4 h-4" />
                <span>M-Pesa STK Push</span>
              </button>
            </div>

            {/* Continue Shopping button */}
            <button
              type="button"
              onClick={handleContinueShopping}
              id="cart-footer-continue-shopping-btn"
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping (Add Forgotten Items)</span>
            </button>

            <p className="text-[11px] text-center text-stone-500">
              Direct to Mbithi ({STORE_INFO.whatsappNumber}) • Pay upon confirmation
            </p>
          </div>
        )}
      </div>

      {/* M-Pesa STK Push / Pochi Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">M-Pesa Payment</h3>
                  <span className="text-[10px] text-stone-400">Safaricom Daraja Gateway</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMpesaModal(false);
                  setMpesaStatus('idle');
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg mt-3">
              <button
                type="button"
                onClick={() => setMpesaSubTab('stk')}
                className={`text-[11px] font-bold py-1.5 rounded-md transition-colors ${
                  mpesaSubTab === 'stk'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                STK Push (Prompt)
              </button>
              <button
                type="button"
                onClick={() => setMpesaSubTab('pochi')}
                className={`text-[11px] font-bold py-1.5 rounded-md transition-colors ${
                  mpesaSubTab === 'pochi'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Pochi la Biashara
              </button>
            </div>

            <div className="py-3 space-y-3">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
                <div className="flex justify-between font-bold">
                  <span>Pay to:</span>
                  <span>Bora Hardware (Mbithi)</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Amount:</span>
                  <span className="font-black text-sm text-stone-950">{formatKES(totalAmount)}</span>
                </div>
              </div>

              {mpesaSubTab === 'stk' ? (
                <div>
                  {!isWaitingForPin ? (
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Your M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => {
                          setMpesaPhone(e.target.value);
                          setStkError(null);
                        }}
                        placeholder="07XXXXXXXX or 2547XXXXXXXX"
                        className="w-full text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono text-stone-900 focus:outline-none focus:border-emerald-500"
                        id="mpesa-modal-phone-input"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        A real Safaricom M-Pesa PIN prompt (STK Push) will pop up on this phone.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-center">
                      <div className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Phone className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-emerald-950 text-xs">
                        STK Push Prompt Dispatched!
                      </h4>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        {stkSuccessMessage ||
                          `Please check phone ${mpesaPhone} and enter your M-Pesa PIN to complete payment of ${formatKES(totalAmount)}.`}
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmOrderAfterPin}
                          disabled={mpesaStatus === 'prompting'}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>I Entered My PIN — Confirm Order</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {stkError && (
                    <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex flex-col gap-1">
                      <span className="font-bold">M-Pesa Notice:</span>
                      <span className="text-[11px]">{stkError}</span>
                      <button
                        type="button"
                        onClick={() => setMpesaSubTab('pochi')}
                        className="text-[11px] font-bold text-amber-900 underline mt-1 text-left"
                      >
                        Try Pochi la Biashara instead &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-700 space-y-1 leading-relaxed">
                    <p className="font-bold text-stone-900">How to pay via Pochi la Biashara:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-stone-600">
                      <li>Dial <span className="font-mono font-bold text-stone-900">*334#</span> or use M-Pesa App</li>
                      <li>Select <strong>Lipa na M-PESA</strong> &rarr; <strong>Pochi la Biashara</strong></li>
                      <li>Enter Phone: <strong className="font-mono text-emerald-800">{STORE_INFO.whatsappNumber}</strong></li>
                      <li>Enter Amount: <strong>{formatKES(totalAmount)}</strong></li>
                      <li>Enter your M-PESA PIN &amp; confirm</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      M-Pesa Transaction Code (from SMS)
                    </label>
                    <input
                      type="text"
                      value={pochiCode}
                      onChange={(e) => setPochiCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SH19X8YZ01"
                      className="w-full text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono font-bold text-stone-900 uppercase focus:outline-none focus:border-amber-500"
                      id="mpesa-modal-pochi-code-input"
                    />
                  </div>
                </div>
              )}

              {mpesaStatus === 'prompting' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-800 animate-pulse">
                  {mpesaSubTab === 'stk'
                    ? 'Sending prompt to phone... Please enter your M-Pesa PIN when prompted.'
                    : 'Verifying M-Pesa transaction with Safaricom network...'}
                </div>
              )}

              {mpesaStatus === 'success' && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-center text-xs text-emerald-900 font-bold">
                  Payment confirmed! Generating Bora Hardware receipt...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowMpesaModal(false);
                  setIsWaitingForPin(false);
                  setStkError(null);
                }}
                className="w-1/3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200"
              >
                Close
              </button>
              {mpesaSubTab === 'stk' ? (
                !isWaitingForPin ? (
                  <button
                    onClick={handleExecuteMpesaSTK}
                    disabled={mpesaStatus !== 'idle'}
                    id="execute-mpesa-push-btn"
                    className="w-2/3 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
                  >
                    {mpesaStatus === 'idle' ? 'Send STK Prompt' : 'Calling Gateway...'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsWaitingForPin(false);
                      setStkError(null);
                    }}
                    type="button"
                    className="w-2/3 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
                  >
                    Resend / Change Phone
                  </button>
                )
              ) : (
                <button
                  onClick={handleExecutePochiPayment}
                  disabled={mpesaStatus !== 'idle'}
                  id="execute-pochi-confirm-btn"
                  className="w-2/3 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all"
                >
                  {mpesaStatus === 'idle' ? 'Confirm Pochi Payment' : 'Verifying...'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

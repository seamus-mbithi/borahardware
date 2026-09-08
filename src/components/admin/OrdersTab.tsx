import React, { useState } from 'react';
import { Order, Product } from '../../types';
import { formatKES } from '../../utils/storage';
import { STORE_INFO } from '../../data/initialProducts';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'cancelled'
  ) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  products,
  onUpdateOrderStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders = orders.filter((ord) => {
    if (filterStatus === 'all') return true;
    return ord.status === filterStatus;
  });

  const totalSalesConfirmed = orders
    .filter((o) => o.status === 'confirmed')
    .reduce((sum, o) => sum + o.subtotal, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'confirmed').length;

  const handleCopyReceipt = (order: Order) => {
    let text = `*BORA HARDWARE - OFFICIAL RECEIPT*\n`;
    text += `Receipt No: ${order.id}\n`;
    text += `Customer: ${order.customerName} (${order.customerPhone})\n`;
    text += `Location: ${order.deliveryLocation || 'Store Pickup'}\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleString()}\n\n`;
    text += `*ITEMS DISPATCHED:*\n`;
    order.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.productName} (${item.quantity} ${item.unit}) = ${formatKES(item.total)}\n`;
    });
    text += `\n*TOTAL PAID/DUE: ${formatKES(order.subtotal)}*\n`;
    text += `Thank you for choosing Bora Hardware! Contact: ${STORE_INFO.whatsappNumber}`;

    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppCustomer = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const validPhone = cleanPhone.startsWith('0')
      ? '254' + cleanPhone.substring(1)
      : cleanPhone;

    const message = `Hello ${order.customerName}, your Bora Hardware order (${order.id}) has been confirmed! Total: ${formatKES(order.subtotal)}. Materials are being prepared for dispatch.`;
    window.open(`https://wa.me/${validPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Confirmed Orders Revenue
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {formatKES(totalSalesConfirmed)}
          </div>
          <span className="text-[11px] text-stone-500">
            {confirmedOrdersCount} completed sale{confirmedOrdersCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Pending Orders Action
          </span>
          <div className="text-2xl font-black text-amber-600">{pendingOrdersCount}</div>
          <span className="text-[11px] text-stone-500">Awaiting dispatch confirmation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Inventory Automation
          </span>
          <div className="text-xs font-medium text-stone-700 mt-1">
            Confirming an order <span className="font-bold text-red-600">subtracts stock</span>.
            Cancelling <span className="font-bold text-emerald-600">restores items</span>.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            id={`filter-orders-${status}`}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold capitalize transition-all ${
              filterStatus === status
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {status} ({orders.filter((o) => (status === 'all' ? true : o.status === status)).length})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-stone-200 text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No orders recorded in this status.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isConfirmed = ord.status === 'confirmed';
            const isCancelled = ord.status === 'cancelled';
            const isPending = ord.status === 'pending';

            return (
              <div
                key={ord.id}
                id={`order-card-${ord.id}`}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                  isConfirmed
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isCancelled
                    ? 'border-stone-200 opacity-75'
                    : 'border-amber-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-stone-900 bg-stone-100 px-2.5 py-1 rounded">
                      {ord.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isConfirmed && <CheckCircle className="w-3 h-3" />}
                      {isCancelled && <XCircle className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      <span>{ord.status}</span>
                    </span>

                    {ord.stockDeducted ? (
                      <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">
                        Stock Deducted
                      </span>
                    ) : (
                      <span className="text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded">
                        Stock Intact
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(ord.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer Details & Items */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                  <div>
                    <span className="text-stone-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                      Customer
                    </span>
                    <div className="font-bold text-stone-900 text-sm">{ord.customerName}</div>
                    <div className="flex items-center gap-1 text-stone-600 mt-1 font-mono">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{ord.customerPhone}</span>
                    </div>
                    {ord.deliveryLocation && (
                      <div className="flex items-center gap-1 text-stone-600 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{ord.deliveryLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Line Items List */}
                  <div className="md:col-span-2 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                    <span className="text-stone-500 uppercase tracking-wider text-[10px] font-bold block mb-2">
                      Items Ordered ({ord.items.length})
                    </span>
                    <div className="space-y-1.5">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-stone-800"
                        >
                          <span className="font-medium">
                            {item.quantity}x {item.productName} ({item.unit})
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            {formatKES(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-900">
                      <span>Total Amount:</span>
                      <span className="text-base font-black text-amber-800">
                        {formatKES(ord.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {ord.notes && (
                  <div className="text-xs text-stone-500 bg-amber-50/50 p-2 rounded border border-amber-100 mb-3">
                    <strong>Note:</strong> {ord.notes}
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyReceipt(ord)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                      id={`copy-receipt-${ord.id}`}
                    >
                      {copiedId === ord.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Receipt</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleWhatsAppCustomer(ord)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors"
                      id={`wa-customer-${ord.id}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Customer</span>
                    </button>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'confirmed')}
                        id={`confirm-order-${ord.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all"
                        title="Deducts stock automatically from product counts"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm & Deduct Stock</span>
                      </button>
                    )}

                    {isConfirmed && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this confirmed order? This will restore the deducted products back into stock.')) {
                            onUpdateOrderStatus(ord.id, 'cancelled');
                          }
                        }}
                        id={`cancel-order-${ord.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-600 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel (Restore Stock)</span>
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'confirmed')}
                        id={`reconfirm-order-${ord.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-lg transition-colors"
                      >
                        <span>Re-Confirm (Deduct)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

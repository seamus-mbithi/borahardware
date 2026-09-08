import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, MessageCircle, AlertCircle, CheckCircle2, Box, Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { formatKES } from '../utils/storage';
import { STORE_INFO } from '../data/initialProducts';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, newQty: number) => void;
  onQuickWhatsApp: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onQuickWhatsApp,
}) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = !product.inStock || product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= product.lowStockThreshold;

  // Max items that can still be added
  const remainingCanAdd = Math.max(0, product.quantity - cartQuantity);

  const hasValidImage = Boolean(product.imageUrl && !imageError);

  return (
    <div
      id={`product-card-${product.id}`}
      className={`group bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        isOutOfStock
          ? 'border-stone-200 opacity-85 bg-stone-50/50'
          : cartQuantity > 0
          ? 'border-amber-400 ring-1 ring-amber-400/40'
          : isLowStock
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-stone-200 hover:border-amber-400'
      }`}
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
            {product.category}
          </span>

          {/* Stock Status Badge */}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              <span>Out of Stock</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Only {product.quantity} left</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{product.quantity} in stock</span>
            </span>
          )}
        </div>

        {/* Optional Product Image */}
        {hasValidImage && (
          <div className="relative w-full h-44 mb-3 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/80 group-hover:border-amber-300 transition-colors">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {product.badge && (
              <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 px-2 py-0.5 rounded shadow-xs">
                {product.badge}
              </span>
            )}
          </div>
        )}

        {/* Product Title */}
        <h3 className="text-base font-bold text-stone-900 leading-snug group-hover:text-amber-800 transition-colors">
          {product.name}
        </h3>

        {/* Unit & Description */}
        <div className="mt-1 text-xs text-stone-500 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-stone-400" />
          <span>Unit: <strong className="text-stone-700">{product.unit}</strong></span>
        </div>

        <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Pricing */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-stone-500 block font-medium">Price</span>
            <span className="text-lg font-black text-stone-900 tracking-tight">
              {formatKES(product.sellingPrice)}
            </span>
            <span className="text-[11px] text-stone-500 ml-1">/ {product.unit}</span>
          </div>

          {product.badge && !hasValidImage && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3.5 bg-stone-50/80 border-t border-stone-100 grid grid-cols-2 gap-2 items-center">
        {/* Quick WhatsApp Order Button */}
        <button
          onClick={() => onQuickWhatsApp(product)}
          disabled={isOutOfStock}
          id={`quick-whatsapp-${product.id}`}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
            isOutOfStock
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95'
          }`}
          title={isOutOfStock ? 'Item is out of stock' : 'Buy directly via WhatsApp'}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        {/* Direct Add to Cart / + and - Quantity Stepper */}
        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-amber-500 rounded-lg p-0.5 shadow-sm border border-amber-600">
            <button
              onClick={() => {
                if (onUpdateQuantity) {
                  onUpdateQuantity(product.id, cartQuantity - 1);
                }
              }}
              id={`card-qty-minus-${product.id}`}
              className="w-7 h-7 rounded-md bg-stone-950/15 hover:bg-stone-950/30 text-stone-950 flex items-center justify-center transition-all active:scale-90 font-bold"
              aria-label="Decrease quantity"
              title="Remove one"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <div className="flex flex-col items-center px-1">
              <span className="text-xs font-black text-stone-950 leading-none">
                {cartQuantity}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-stone-900/80 leading-tight">
                in cart
              </span>
            </div>
            <button
              onClick={() => {
                if (onUpdateQuantity) {
                  onUpdateQuantity(product.id, cartQuantity + 1);
                } else {
                  onAddToCart(product);
                }
              }}
              disabled={remainingCanAdd <= 0}
              id={`card-qty-plus-${product.id}`}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 font-bold ${
                remainingCanAdd <= 0
                  ? 'text-stone-700/40 cursor-not-allowed bg-amber-400/40'
                  : 'bg-stone-950/15 hover:bg-stone-950/30 text-stone-950'
              }`}
              aria-label="Increase quantity"
              title={remainingCanAdd <= 0 ? 'Max available stock reached' : 'Add one more'}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock || remainingCanAdd <= 0}
            id={`add-to-cart-${product.id}`}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm active:scale-95'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
};

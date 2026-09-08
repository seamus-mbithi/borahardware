import React, { useState } from 'react';
import { Product } from '../../types';
import { formatKES } from '../../utils/storage';
import {
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface StockTabProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

export const StockTab: React.FC<StockTabProps> = ({ products, onUpdateProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'low' | 'out'>('all');

  const handleAdjustQuantity = (product: Product, delta: number) => {
    const newQty = Math.max(0, product.quantity + delta);
    const updated: Product = {
      ...product,
      quantity: newQty,
      inStock: newQty > 0 ? product.inStock : false,
    };
    onUpdateProduct(updated);
  };

  const handleSetExactQuantity = (product: Product, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (isNaN(val) || val < 0) return;

    const updated: Product = {
      ...product,
      quantity: val,
      inStock: val > 0 ? (val === 0 ? false : product.inStock) : false,
    };
    onUpdateProduct(updated);
  };

  const handleToggleStockStatus = (product: Product) => {
    const newInStock = !product.inStock;
    const updated: Product = {
      ...product,
      inStock: newInStock,
      // If toggling on but quantity is 0, give at least 1 unit so customer can buy
      quantity: newInStock && product.quantity === 0 ? 10 : product.quantity,
    };
    onUpdateProduct(updated);
  };

  // Metrics
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => !p.inStock || p.quantity <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.inStock && p.quantity > 0 && p.quantity <= p.lowStockThreshold
  ).length;
  const healthyCount = products.filter(
    (p) => p.inStock && p.quantity > p.lowStockThreshold
  ).length;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === 'out') {
      return !p.inStock || p.quantity <= 0;
    }
    if (filterState === 'low') {
      return p.inStock && p.quantity > 0 && p.quantity <= p.lowStockThreshold;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <Layers className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalProducts}</div>
          <span className="text-[11px] text-stone-500">Tracked items in catalog</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{healthyCount}</div>
          <span className="text-[11px] text-stone-500">Above alert threshold</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockCount}</div>
          <span className="text-[11px] text-stone-500">Needs restock re-order</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{outOfStockCount}</div>
          <span className="text-[11px] text-stone-500">Zero inventory</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items to adjust..."
            className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
            id="stock-search-input"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterState('all')}
            id="filter-stock-all"
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterState === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Items ({totalProducts})
          </button>
          <button
            onClick={() => setFilterState('low')}
            id="filter-stock-low"
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterState === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterState('out')}
            id="filter-stock-out"
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterState === 'out'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Stock Cards / List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">In-Stock Toggle</th>
                <th className="py-3 px-4 text-center">Remaining Quantity</th>
                <th className="py-3 px-4 text-center">Quick Adjust</th>
                <th className="py-3 px-4">Stock Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No hardware items found in this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isOutOfStock = !p.inStock || p.quantity <= 0;
                  const isLow = !isOutOfStock && p.quantity <= p.lowStockThreshold;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isOutOfStock ? 'bg-red-50/30' : isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{p.name}</div>
                        <div className="text-[11px] text-stone-500">
                          Unit: <span className="font-medium text-stone-700">{p.unit}</span> •{' '}
                          Price: {formatKES(p.sellingPrice)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* In-Stock Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStockStatus(p)}
                          id={`toggle-stock-status-${p.id}`}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            p.inStock ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                          title={p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              p.inStock ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="text-[10px] text-stone-500 mt-0.5 font-medium">
                          {p.inStock ? 'Active' : 'Disabled'}
                        </div>
                      </td>

                      {/* Direct Quantity Input */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={p.quantity}
                            onChange={(e) => handleSetExactQuantity(p, e.target.value)}
                            className="w-16 text-center text-sm font-bold font-mono bg-stone-50 border border-stone-300 rounded-lg py-1 px-1 text-stone-900 focus:outline-none focus:border-amber-500"
                            id={`stock-input-${p.id}`}
                          />
                          <span className="text-[11px] text-stone-500">{p.unit}</span>
                        </div>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustQuantity(p, -10)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-mono font-bold"
                            title="Subtract 10 units"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(p, -1)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-mono font-bold"
                            title="Subtract 1 unit"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(p, 1)}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-mono font-bold"
                            title="Add 1 unit"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(p, 10)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-mono font-bold"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Stock Health */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Out of Stock</span>
                          </div>
                        ) : isLow ? (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>Low (Limit: {p.lowStockThreshold})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>Good Supply</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

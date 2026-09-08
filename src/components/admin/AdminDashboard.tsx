import React, { useState } from 'react';
import { Product, Order, DarajaConfig } from '../../types';
import { ProductsTab } from './ProductsTab';
import { StockTab } from './StockTab';
import { OrdersTab } from './OrdersTab';
import { RevenueTab } from './RevenueTab';
import { DarajaTab } from './DarajaTab';
import {
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  darajaConfig: DarajaConfig;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'cancelled'
  ) => void;
  onSaveDarajaConfig: (cfg: DarajaConfig) => void;
  onExitAdmin: () => void;
  onLogout: () => void;
}

type AdminTab = 'products' | 'stock' | 'orders' | 'revenue' | 'daraja';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  darajaConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onSaveDarajaConfig,
  onExitAdmin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = products.filter(
    (p) => p.inStock && p.quantity <= p.lowStockThreshold
  ).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Branding & Staff indicator */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-tight">Bora Hardware</span>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Admin Portal
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Signed in as <strong>Store Owner / Administrator</strong>
                </p>
              </div>
            </div>

            {/* Right: Return to store and Logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={onExitAdmin}
                id="admin-view-store-btn"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Storefront</span>
              </button>

              <button
                onClick={onLogout}
                id="admin-logout-btn"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/40 rounded-lg transition-colors"
                title="Log out from admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setActiveTab('products')}
              id="admin-tab-products"
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'products'
                  ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              id="admin-tab-stock"
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors relative ${
                activeTab === 'stock'
                  ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Manage Stock</span>
              {lowStockCount > 0 && (
                <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              id="admin-tab-orders"
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors relative ${
                activeTab === 'orders'
                  ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders & Sales</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              id="admin-tab-revenue"
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'revenue'
                  ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Revenue & Profit Margins</span>
            </button>

            <button
              onClick={() => setActiveTab('daraja')}
              id="admin-tab-daraja"
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'daraja'
                  ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Daraja M-Pesa API</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab products={products} onUpdateProduct={onUpdateProduct} />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            products={products}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        )}

        {activeTab === 'revenue' && (
          <RevenueTab orders={orders} products={products} />
        )}

        {activeTab === 'daraja' && (
          <DarajaTab config={darajaConfig} onSaveConfig={onSaveDarajaConfig} />
        )}
      </main>
    </div>
  );
};

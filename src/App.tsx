import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Order, DarajaConfig } from './types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  updateOrderStatusAndStock,
  getAdminSession,
  setAdminSession,
  getDarajaConfig,
  saveDarajaConfig,
  formatKES,
} from './utils/storage';
import {
  subscribeToProducts,
  saveProductToCloud,
  deleteProductFromCloud,
  subscribeToOrders,
  saveOrderToCloud,
} from './lib/api';
import { STORE_INFO } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  CheckCircle2,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  Building,
  Wrench,
  Search,
  Package,
  X,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  Zap,
} from 'lucide-react';

const QUICK_SEARCH_CHIPS = [
  { label: 'Simba Cement', query: 'Simba Cement' },
  { label: 'TMT Steel Rebar', query: 'Rebar' },
  { label: 'Box Mabati 30G', query: 'Mabati' },
  { label: 'Binding Wire', query: 'Binding Wire' },
  { label: 'PPR / PVC Pipes', query: 'Pipe' },
  { label: 'Crown Paint', query: 'Paint' },
  { label: 'Roofing Nails', query: 'Nails' },
];

export default function App() {
  // Inventory and Orders State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [darajaConfig, setDarajaConfig] = useState<DarajaConfig>(getDarajaConfig());

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_desc'>('featured');

  // Admin Portal State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize data on mount and subscribe to cloud API
  useEffect(() => {
    // Immediate load from local storage for instantaneous UI response
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setIsAdminLoggedIn(getAdminSession());

    // Subscribe to live cloud products via API
    const unsubProducts = subscribeToProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
        saveStoredProducts(liveProducts);
      }
    });

    // Subscribe to live cloud orders via API
    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
        saveStoredOrders(liveOrders);
      }
    });

    // Check URL for admin access e.g. #admin or /admin
    if (
      window.location.hash.toLowerCase() === '#admin' ||
      window.location.pathname.toLowerCase().includes('/admin') ||
      window.location.search.toLowerCase().includes('admin')
    ) {
      if (getAdminSession()) {
        setIsAdminViewOpen(true);
      } else {
        setShowLoginModal(true);
      }
    }

    // Keyboard shortcut for discrete admin access: Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        triggerAdminAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const triggerAdminAccess = () => {
    if (isAdminLoggedIn) {
      setIsAdminViewOpen(true);
    } else {
      setShowLoginModal(true);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Cross-category matches check (detects if search query exists in other categories)
  const crossCategoryMatches = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || selectedCategory === 'All') return [];
    const words = query.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const text = `${p.name} ${p.category} ${p.description} ${p.unit} ${p.sellingPrice} ${p.badge || ''}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [products, searchQuery, selectedCategory]);

  // Is current search automatically expanded to all categories because no matches exist in selected category?
  const isAutoExpandedToAll = useMemo(() => {
    if (!searchQuery.trim() || selectedCategory === 'All') return false;
    const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const hasCategoryMatches = products.some(
      (p) =>
        p.category === selectedCategory &&
        queryWords.every((w) =>
          `${p.name} ${p.category} ${p.description} ${p.unit} ${p.sellingPrice} ${p.badge || ''}`
            .toLowerCase()
            .includes(w)
        )
    );
    return !hasCategoryMatches && crossCategoryMatches.length > 0;
  }, [products, searchQuery, selectedCategory, crossCategoryMatches]);

  // Filtered products - automatically updates and filters directly
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query ? query.split(/\s+/).filter(Boolean) : [];

    const effectiveCategory = isAutoExpandedToAll ? 'All' : selectedCategory;

    const list = products.filter((p) => {
      // 1. Multi-term query matching
      let matchesQuery = true;
      if (queryWords.length > 0) {
        const text = `${p.name} ${p.category} ${p.description} ${p.unit} ${p.sellingPrice} ${p.badge || ''}`.toLowerCase();
        matchesQuery = queryWords.every((w) => text.includes(w));
      }

      // 2. Category matching
      const matchesCat = effectiveCategory === 'All' || p.category === effectiveCategory;

      // 3. In-stock matching
      const matchesStock = !onlyInStock || (p.inStock && p.quantity > 0);

      return matchesQuery && matchesCat && matchesStock;
    });

    // 4. Sort results
    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'stock_desc') return b.quantity - a.quantity;
      return 0; // default / featured
    });
  }, [products, searchQuery, selectedCategory, onlyInStock, sortBy, isAutoExpandedToAll]);

  // Cart Actions
  const handleAddToCart = (product: Product) => {
    if (!product.inStock || product.quantity <= 0) {
      showToast(`${product.name} is currently out of stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          showToast(`Maximum available stock (${product.quantity} ${product.unit}) reached in cart`);
          return prev;
        }
        showToast(`Added another ${product.name} to cart`);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showToast(`Added ${product.name} to cart`);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = item.product.quantity;
          const clamped = Math.min(newQty, maxAllowed);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);
    saveOrderToCloud(newOrder).catch((err) => {
      console.warn('Order cloud sync warning:', err);
    });
    showToast(`Order ${newOrder.id} logged for Bora Hardware!`);
  };

  // Quick WhatsApp for single product
  const handleQuickWhatsApp = (product: Product) => {
    const message = `Hello Bora Hardware, I would like to order: *1x ${product.name}* (${formatKES(
      product.sellingPrice
    )} / ${product.unit}). Is this available for immediate dispatch?`;
    window.open(
      `https://wa.me/${STORE_INFO.cleanPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  // Admin Management Actions
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setAdminSession(true);
    setShowLoginModal(false);
    setIsAdminViewOpen(true);
    showToast('Welcome back to Admin Management');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminSession(false);
    setIsAdminViewOpen(false);
    showToast('Signed out of admin portal');
  };

  const handleAddProduct = (newProd: Product) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    saveProductToCloud(newProd).catch((err) => {
      console.warn('Product cloud add warning:', err);
    });
    showToast(`Added ${newProd.name} to store`);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    saveStoredProducts(updated);
    saveProductToCloud(updatedProd).catch((err) => {
      console.warn('Product cloud update warning:', err);
    });
    showToast(`Updated ${updatedProd.name}`);
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    deleteProductFromCloud(productId).catch((err) => {
      console.warn('Product cloud delete warning:', err);
    });
    showToast(`Deleted ${prod?.name || 'product'}`);
  };

  // Updates order status and syncs stock subtraction/restoration
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'cancelled'
  ) => {
    const { updatedProducts, updatedOrders } = updateOrderStatusAndStock(
      orderId,
      newStatus,
      products,
      orders
    );
    setProducts(updatedProducts);
    setOrders(updatedOrders);

    // Sync changed order to Cloud
    const targetOrder = updatedOrders.find((o) => o.id === orderId);
    if (targetOrder) {
      saveOrderToCloud(targetOrder).catch(console.warn);
    }

    // Sync products with modified quantities to Cloud
    updatedProducts.forEach((p) => {
      const prev = products.find((old) => old.id === p.id);
      if (prev && prev.quantity !== p.quantity) {
        saveProductToCloud(p).catch(console.warn);
      }
    });

    if (newStatus === 'confirmed') {
      showToast(`Order confirmed! Stock subtracted from inventory.`);
    } else if (newStatus === 'cancelled') {
      showToast(`Order cancelled. Stock restored to inventory.`);
    } else {
      showToast(`Order updated to ${newStatus}.`);
    }
  };

  const handleSaveDarajaConfig = (cfg: DarajaConfig) => {
    setDarajaConfig(cfg);
    saveDarajaConfig(cfg);
    showToast('M-Pesa Daraja configuration updated');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If Admin View is active and authenticated, show full Admin Dashboard
  if (isAdminViewOpen && isAdminLoggedIn) {
    return (
      <AdminDashboard
        products={products}
        orders={orders}
        darajaConfig={darajaConfig}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onSaveDarajaConfig={handleSaveDarajaConfig}
        onExitAdmin={() => setIsAdminViewOpen(false)}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Store Header */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={triggerAdminAccess}
        products={products}
        onAddToCart={handleAddToCart}
      />

      {/* Hero / Value Proposition Section */}
      <section className="bg-stone-900 text-stone-100 border-b border-stone-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full">
                <Building className="w-3.5 h-3.5" />
                <span>BORA HARDWARE </span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Quality Construction Materials,{' '}
                <span className="text-amber-400">Direct To Your Site.</span>
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Shop genuine Simba Cement 50kg at <strong>KSh 850</strong>, high-tensile TMT rebar,
                gauge 30 box mabati, and plumbing fittings. Order via WhatsApp or Cart with fast on-site delivery.
              </p>
            </div>

            {/* Quick Contact Box */}
            <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">Direct WhatsApp Hotline</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-white tracking-tight">
                {STORE_INFO.whatsappNumber}
              </div>
              <a
                href={`https://wa.me/${STORE_INFO.cleanPhone}?text=Hello%20Bora%20Hardware,%20I%20would%20like%20to%20request%20a%20site%20delivery%20quotation.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat & Order on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Direct Site Offloading</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>KEBS Certified Materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Real-Time Stock Counts</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant WhatsApp Quotes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <main id="catalog-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-20">
        {/* Instant Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Direct Auto-Updating Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Direct auto-search by name, size, category, or price (e.g. Simba, 850, Rebar)..."
                className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 text-sm rounded-lg pl-10 pr-9 py-2.5 border border-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                id="catalog-direct-search-input"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters: In-stock and Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`text-xs px-3 py-2 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  onlyInStock
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-stone-50 border-stone-300 text-stone-600 hover:bg-stone-100'
                }`}
                title="Filter by available stock"
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                    onlyInStock ? 'bg-emerald-600 text-white' : 'border border-stone-400'
                  }`}
                >
                  {onlyInStock ? '✓' : ''}
                </div>
                <span>In Stock Only</span>
              </button>

              {/* Sort selector */}
              <div className="relative flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-stone-50 border border-stone-300 text-stone-700 font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                  id="catalog-sort-select"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="stock_desc">Highest Stock</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute left-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Search Chips for One-Click Auto-Filtering */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Quick:
            </span>
            {QUICK_SEARCH_CHIPS.map((chip) => {
              const isActive = searchQuery.toLowerCase().includes(chip.query.toLowerCase());
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(chip.query);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <span>{chip.label}</span>
                  {isActive && <X className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
            {(searchQuery || selectedCategory !== 'All' || onlyInStock) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setOnlyInStock(false);
                }}
                className="ml-auto text-[11px] font-bold text-rose-600 hover:text-rose-800 underline whitespace-nowrap shrink-0 pl-2"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>{selectedCategory === 'All' ? 'All Hardware Materials' : selectedCategory}</span>
                <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
                  {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
                </span>
              </h2>

              {searchQuery && (
                <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                  <span>Filtered for &ldquo;{searchQuery}&rdquo;</span>
                </span>
              )}
            </div>

            {isAutoExpandedToAll && (
              <p className="text-xs text-amber-800 font-medium mt-1 flex items-center gap-1">
                <span>💡 Showing results found across all categories for &ldquo;{searchQuery}&rdquo;.</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="underline font-bold hover:text-amber-950"
                >
                  Keep &ldquo;All&rdquo; selected
                </button>
              </p>
            )}
          </div>

          <div className="text-xs text-stone-500 hidden sm:block">
            Prices in Kenyan Shillings (KES) • Instant Stock Updates
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">
              {searchQuery ? `No hardware products matching "${searchQuery}"` : 'No hardware products found'}
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto">
              {onlyInStock
                ? 'Some items might be currently out of stock. Try toggling "In Stock Only" off or resetting your search.'
                : 'Try adjusting your spelling or pick from our most requested construction supplies below:'}
            </p>

            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {['Simba Cement', 'TMT Rebar', 'Box Mabati', 'Binding Wire'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    setSelectedCategory('All');
                    setOnlyInStock(false);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Search &ldquo;{term}&rdquo;
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setOnlyInStock(false);
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Reset All Filters
              </button>
              {onlyInStock && (
                <button
                  type="button"
                  onClick={() => setOnlyInStock(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Show Out-of-Stock Items
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              const cartQty = inCart ? inCart.quantity : 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={cartQty}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onQuickWhatsApp={handleQuickWhatsApp}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        availableProducts={products}
        onAddToCart={handleAddToCart}
      />

      {/* Admin Login Modal (Triggered via discreet footer or shortcut) */}
      {showLoginModal && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Store Footer */}
      <Footer onOpenAdmin={triggerAdminAccess} isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
}

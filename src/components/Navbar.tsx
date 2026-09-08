import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Phone, Search, Wrench, ShieldCheck, ArrowRight, X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { STORE_INFO } from '../data/initialProducts';
import { Product } from '../types';
import { formatKES } from '../utils/storage';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  products?: Product[];
  onAddToCart?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isAdminLoggedIn,
  onOpenAdmin,
  products = [],
  onAddToCart,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Matching preview products for the instant search dropdown
  const previewMatches = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const words = query.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const text = `${p.name} ${p.category} ${p.description} ${p.unit} ${p.sellingPrice}`.toLowerCase();
      return words.every((w) => text.includes(w));
    }).slice(0, 5);
  }, [products, searchQuery]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (val: string) => {
    onSearchChange(val);
    if (val.trim()) {
      setIsSearchFocused(true);
      // If user starts typing from top, smoothly scroll to catalog
      if (window.scrollY < 180) {
        scrollToCatalog();
      }
    }
  };

  const handleSelectProduct = (product: Product) => {
    setIsSearchFocused(false);
    const card = document.getElementById(`product-card-${product.id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-4', 'ring-amber-400');
      setTimeout(() => {
        card.classList.remove('ring-4', 'ring-amber-400');
      }, 2000);
    } else {
      scrollToCatalog();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top emergency / contact banner */}
      <div className="bg-amber-600 text-amber-950 text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto">
          <span>🏗️ {STORE_INFO.name} — Direct On-Site Deliveries </span>
          <span className="hidden sm:inline text-amber-900">•</span>
          <a
            href={`https://wa.me/${STORE_INFO.cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            Order Hot-Line: {STORE_INFO.whatsappNumber}
          </a>
        </div>
        {isAdminLoggedIn && (
          <button
            onClick={onOpenAdmin}
            id="admin-status-indicator-btn"
            className="bg-stone-900 text-amber-300 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 hover:bg-stone-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Active</span>
          </button>
        )}
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 shadow-inner">
            <Wrench className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>BORA</span>
              <span className="text-amber-400 font-light">HARDWARE</span>
            </h1>
            <p className="text-[11px] text-stone-400 -mt-0.5 font-medium tracking-wide uppercase">
              Building Supplies & Steel
            </p>
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search cement, rebar, mabati, paint, nails..."
              className="w-full bg-stone-800 text-stone-100 placeholder-stone-400 text-sm rounded-lg pl-10 pr-9 py-2 border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              id="desktop-search-input"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white bg-stone-700 hover:bg-stone-600 rounded-full p-0.5 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant live dropdown preview */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden text-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-semibold">
                  Instant Matches for &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-stone-400">
                  {previewMatches.length} product{previewMatches.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {previewMatches.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  <p>No exact matches found for &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setIsSearchFocused(false);
                    }}
                    className="mt-2 text-amber-400 hover:underline text-[11px] font-medium"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-800 max-h-72 overflow-y-auto">
                  {previewMatches.map((product) => {
                    const isOutOfStock = !product.inStock || product.quantity <= 0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="p-2.5 hover:bg-stone-800/80 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-white truncate">
                              {product.name}
                            </span>
                            {product.badge && (
                              <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                            <span className="text-stone-300 font-bold text-amber-400">
                              {formatKES(product.sellingPrice)}
                            </span>
                            <span>•</span>
                            <span className="text-stone-400 text-[10px]">{product.category}</span>
                            <span>•</span>
                            {isOutOfStock ? (
                              <span className="text-red-400 text-[10px]">Out of stock</span>
                            ) : (
                              <span className="text-emerald-400 text-[10px]">
                                {product.quantity} in stock
                              </span>
                            )}
                          </div>
                        </div>

                        {onAddToCart && !isOutOfStock && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                            title="Add to cart"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-2 bg-stone-950 border-t border-stone-800 text-center">
                <button
                  onClick={() => {
                    setIsSearchFocused(false);
                    scrollToCatalog();
                  }}
                  className="text-xs text-stone-400 hover:text-amber-400 font-medium transition-colors"
                >
                  View all results filtered below in catalog &darr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick WhatsApp Support Call/Chat */}
          <a
            href={`https://wa.me/${STORE_INFO.cleanPhone}?text=Hello%20Bora%20Hardware,%20I%20have%20an%20inquiry%20about%20materials%20and%20prices.`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            id="quick-whatsapp-nav-btn"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp Order</span>
          </a>

          {/* Cart trigger button */}
          <button
            onClick={onOpenCart}
            id="header-cart-btn"
            className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3.5 py-2 rounded-lg transition-all shadow-md active:scale-95"
            aria-label="View Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Cart</span>
            {cartCount > 0 ? (
              <span className="bg-stone-950 text-amber-400 text-xs font-black px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {cartCount}
              </span>
            ) : (
              <span className="text-xs bg-amber-600/30 text-stone-900 px-1.5 py-0.5 rounded text-[11px]">
                0
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar - Always visible and direct */}
      <div ref={mobileSearchRef} className="md:hidden px-4 pb-2.5 pt-1 bg-stone-900 border-t border-stone-800/80">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search cement, steel, roofing, paint..."
            className="w-full bg-stone-800 text-stone-100 placeholder-stone-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-stone-700 focus:outline-none focus:border-amber-500"
            id="mobile-search-input"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsSearchFocused(false);
              }}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white bg-stone-700 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="border-t border-stone-800 bg-stone-950/80 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                id={`cat-pill-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

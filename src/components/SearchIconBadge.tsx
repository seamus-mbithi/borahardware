import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCw, Layers, Boxes, ChevronDown } from 'lucide-react';

export type SearchFocusMode = 'all' | 'spinners' | 'ironsheets' | 'cement';

export interface SearchIconBadgeProps {
  currentQuery: string;
  onSelectKeyword: (keyword: string) => void;
  size?: 'sm' | 'md';
  showQuickPills?: boolean;
  pillTheme?: 'dark' | 'light';
  idPrefix?: string;
}

export const SEARCH_FEATURED_ITEMS = [
  {
    id: 'spinners',
    label: 'Spinners',
    query: 'spinner',
    icon: RotateCw,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
    activeBg: 'bg-amber-500 text-stone-950 border-amber-400 font-bold',
    description: 'Wire twisters & spinners',
    spin: true,
  },
  {
    id: 'ironsheets',
    label: 'Iron Sheets',
    query: 'iron sheets',
    icon: Layers,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-400/10 border-sky-400/30 text-sky-300',
    activeBg: 'bg-sky-500 text-stone-950 border-sky-400 font-bold',
    description: 'Mabati 30G & box profile',
    spin: false,
  },
  {
    id: 'cement',
    label: 'Cement',
    query: 'cement',
    icon: Boxes,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
    activeBg: 'bg-emerald-500 text-stone-950 border-emerald-400 font-bold',
    description: 'Simba 50kg & masonry',
    spin: false,
  },
] as const;

export const SearchIconBadge: React.FC<SearchIconBadgeProps> = ({
  currentQuery,
  onSelectKeyword,
  size = 'md',
  showQuickPills = false,
  pillTheme = 'dark',
  idPrefix = 'search',
}) => {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  // Determine active item based on current search text
  const q = currentQuery.toLowerCase().trim();
  const activeItem = SEARCH_FEATURED_ITEMS.find(
    (item) =>
      q.includes(item.query) ||
      (item.id === 'ironsheets' && (q.includes('mabati') || q.includes('sheet') || q.includes('ironsheet'))) ||
      (item.id === 'spinners' && (q.includes('spinner') || q.includes('twister')))
  );

  // Auto-cycle between Search, Spinners, Iron Sheets, and Cement when idle
  useEffect(() => {
    if (activeItem || q.length > 0) return; // Keep fixed when searching or active

    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % 4); // 0: Search, 1: Spinners, 2: Iron Sheets, 3: Cement
    }, 2800);

    return () => clearInterval(timer);
  }, [activeItem, q]);

  // Current displayed icon
  const getDisplayDetails = () => {
    if (activeItem) {
      const IconComponent = activeItem.icon;
      return {
        icon: <IconComponent className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${activeItem.iconColor} ${activeItem.spin ? 'animate-spin' : ''}`} />,
        label: activeItem.label,
        active: true,
      };
    }

    // Idle cycling mode
    switch (cycleIndex) {
      case 1:
        return {
          icon: <RotateCw className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-400 animate-spin`} />,
          label: 'Spinners',
          active: false,
        };
      case 2:
        return {
          icon: <Layers className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-sky-400`} />,
          label: 'Iron Sheets',
          active: false,
        };
      case 3:
        return {
          icon: <Boxes className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-400`} />,
          label: 'Cement',
          active: false,
        };
      case 0:
      default:
        return {
          icon: <Search className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-stone-400`} />,
          label: 'Search',
          active: false,
        };
    }
  };

  const currentDisplay = getDisplayDetails();

  return (
    <div ref={menuRef} className="relative inline-flex items-center">
      {/* Search icon button with click-to-filter menu */}
      <button
        type="button"
        id={`${idPrefix}-dynamic-icon-btn`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        title={`Click to filter: Spinners, Iron Sheets, or Cement (Currently showing: ${currentDisplay.label})`}
        className={`group flex items-center justify-center rounded-md p-1 transition-all duration-200 focus:outline-none ${
          currentDisplay.active
            ? 'bg-stone-800/80 ring-1 ring-amber-500/50 scale-105'
            : 'hover:bg-stone-700/60'
        }`}
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          {currentDisplay.icon}
        </span>
        <ChevronDown className="w-2.5 h-2.5 text-stone-500 group-hover:text-stone-300 ml-0.5 opacity-60" />
      </button>

      {/* Quick popup menu when clicking the search icon */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800 mb-1">
            Quick Hardware Filters
          </div>
          <div className="space-y-1">
            {SEARCH_FEATURED_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`${idPrefix}-menu-item-${item.id}`}
                  onClick={() => {
                    onSelectKeyword(isSelected ? '' : item.query);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-200 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-stone-950/20' : 'bg-stone-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-stone-950' : item.iconColor} ${item.spin ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold leading-tight">{item.label}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-stone-800 flex items-center justify-between px-1 text-[10px]">
            <button
              type="button"
              onClick={() => {
                onSelectKeyword('');
                setIsMenuOpen(false);
              }}
              className="text-stone-400 hover:text-amber-400 font-medium"
            >
              Reset to All
            </button>
            <span className="text-stone-500">Instant direct search</span>
          </div>
        </div>
      )}

      {/* Optional horizontal quick pills */}
      {showQuickPills && (
        <div className="flex items-center gap-1.5 ml-2">
          {SEARCH_FEATURED_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`${idPrefix}-pill-${item.id}`}
                onClick={() => onSelectKeyword(isSelected ? '' : item.query)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  isSelected
                    ? item.activeBg
                    : pillTheme === 'dark'
                    ? 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white'
                    : 'bg-stone-100 border-stone-300 text-stone-700 hover:border-stone-400 hover:bg-white'
                }`}
                title={`Filter by ${item.label}`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-stone-950' : item.iconColor} ${item.spin ? 'animate-spin' : ''}`} />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Product } from '../../types';
import { formatKES } from '../../utils/storage';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProductsTabProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const CATEGORIES = [
  'Cement & Masonry',
  'Steel & Wire',
  'Roofing',
  'Paints & Finishes',
  'Plumbing & Drainage',
  'Tools & Equipment',
  'Fasteners & Fixings',
  'Chemicals & Admixtures',
  'Hardware & Security',
  'Electrical',
];

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cement & Masonry');
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formBuyingPrice, setFormBuyingPrice] = useState<number>(0);
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formUnit, setFormUnit] = useState('Piece');
  const [formDescription, setFormDescription] = useState('');
  const [formLowStock, setFormLowStock] = useState<number>(10);
  const [formInStock, setFormInStock] = useState<boolean>(true);
  const [formBadge, setFormBadge] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Cement & Masonry');
    setFormSellingPrice(0);
    setFormBuyingPrice(0);
    setFormQuantity(20);
    setFormUnit('Piece');
    setFormDescription('');
    setFormLowStock(10);
    setFormInStock(true);
    setFormBadge('');
    setFormImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSellingPrice(prod.sellingPrice);
    setFormBuyingPrice(prod.buyingPrice);
    setFormQuantity(prod.quantity);
    setFormUnit(prod.unit);
    setFormDescription(prod.description);
    setFormLowStock(prod.lowStockThreshold || 10);
    setFormInStock(prod.inStock);
    setFormBadge(prod.badge || '');
    setFormImageUrl(prod.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert('Product name is required');
      return;
    }

    const calculatedInStock = formQuantity > 0 ? formInStock : false;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        sellingPrice: Number(formSellingPrice),
        buyingPrice: Number(formBuyingPrice),
        quantity: Number(formQuantity),
        unit: formUnit.trim() || 'Piece',
        description: formDescription.trim(),
        lowStockThreshold: Number(formLowStock),
        inStock: calculatedInStock,
        badge: formBadge.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
      };
      onUpdateProduct(updated);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        sellingPrice: Number(formSellingPrice),
        buyingPrice: Number(formBuyingPrice),
        quantity: Number(formQuantity),
        unit: formUnit.trim() || 'Piece',
        description: formDescription.trim(),
        lowStockThreshold: Number(formLowStock),
        inStock: calculatedInStock,
        badge: formBadge.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
      };
      onAddProduct(newProd);
    }

    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCat === 'All' || p.category === selectedCat;
    return matchesSearch && matchesCategory;
  });

  const calcUnitProfit = formSellingPrice - formBuyingPrice;
  const calcMarginPct =
    formSellingPrice > 0 ? ((calcUnitProfit / formSellingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search catalog by name or category..."
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              id="admin-product-search"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:border-amber-500"
            id="admin-category-filter"
          >
            <option value="All">All Categories ({products.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          id="admin-add-product-btn"
          className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Buying Price</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Profit / Unit</th>
                <th className="py-3 px-4">Stock Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitPerUnit = p.sellingPrice - p.buyingPrice;
                  const marginPct =
                    p.sellingPrice > 0
                      ? ((profitPerUnit / p.sellingPrice) * 100).toFixed(1)
                      : '0';
                  const isOutOfStock = !p.inStock || p.quantity <= 0;
                  const isLow = !isOutOfStock && p.quantity <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        <div className="font-bold text-stone-900">{p.name}</div>
                        <div className="text-[11px] text-stone-500 font-normal">
                          Unit: {p.unit}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {formatKES(p.buyingPrice)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {formatKES(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-700">
                          +{formatKES(profitPerUnit)}
                        </div>
                        <span className="text-[10px] text-emerald-600">({marginPct}% margin)</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold font-mono ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-stone-900'
                          }`}
                        >
                          {p.quantity}
                        </span>
                        <span className="text-stone-500 text-[11px] ml-1">{p.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Low ({p.quantity})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            id={`edit-prod-${p.id}`}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            id={`delete-prod-${p.id}`}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base">
                {editingProduct ? 'Edit Hardware Product' : 'Add New Hardware Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Simba Cement 50kg, D10 Rebar, etc."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Packaging Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. 50kg Bag, Piece (12m), 25kg Roll"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Buying Price (Cost KSh) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formBuyingPrice || ''}
                    onChange={(e) => setFormBuyingPrice(Number(e.target.value))}
                    placeholder="e.g. 720"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Selling Price (Retail KSh) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formSellingPrice || ''}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    placeholder="e.g. 850"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Profit Preview */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Profit Preview:</span>
                </div>
                <div className="font-mono font-bold text-emerald-900">
                  +{formatKES(calcUnitProfit)} per unit ({calcMarginPct}% margin)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formLowStock}
                    onChange={(e) => setFormLowStock(Number(e.target.value))}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Description & Specifications
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Material specs, grade, gauge or application"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Product Photo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or direct image link"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                />
                {formImageUrl.trim() && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-stone-100 rounded-lg border border-stone-200">
                    <img
                      src={formImageUrl.trim()}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded border border-stone-300 bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="text-[11px] text-stone-600 truncate">
                      Image preview active
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={formInStock}
                    onChange={(e) => setFormInStock(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-stone-300 focus:ring-amber-400"
                  />
                  <span>Mark as Available In Stock</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="admin-save-product-btn"
                  className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

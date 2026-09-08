import React, { useState } from 'react';
import { Order, Product } from '../../types';
import { formatKES } from '../../utils/storage';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  PieChart,
  Boxes,
  Percent,
} from 'lucide-react';

interface RevenueTabProps {
  orders: Order[];
  products: Product[];
}

export const RevenueTab: React.FC<RevenueTabProps> = ({ orders, products }) => {
  const [sortField, setSortField] = useState<'profit' | 'revenue' | 'sold'>('profit');

  // Filter ONLY confirmed orders to calculate realized financials
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');

  let totalRevenue = 0;
  let totalCOGS = 0;

  // Per-product sales tracking map
  const productPerformanceMap: Record<
    string,
    {
      productId: string;
      productName: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cogs: number;
      profit: number;
    }
  > = {};

  // Initialize with all products so Mbithi sees items even with 0 sales yet
  products.forEach((p) => {
    productPerformanceMap[p.id] = {
      productId: p.id,
      productName: p.name,
      category: p.category,
      unitsSold: 0,
      revenue: 0,
      cogs: 0,
      profit: 0,
    };
  });

  confirmedOrders.forEach((ord) => {
    totalRevenue += ord.subtotal;
    ord.items.forEach((item) => {
      const lineCost = item.quantity * item.buyingPrice;
      const lineRev = item.total;
      const lineProfit = lineRev - lineCost;
      totalCOGS += lineCost;

      if (!productPerformanceMap[item.productId]) {
        productPerformanceMap[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          category: 'Hardware Item',
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
      }

      const existing = productPerformanceMap[item.productId];
      existing.unitsSold += item.quantity;
      existing.revenue += lineRev;
      existing.cogs += lineCost;
      existing.profit += lineProfit;
    });
  });

  const totalProfit = totalRevenue - totalCOGS;
  const overallMarginPct =
    totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Stock on shelf valuations
  const shelfSellingValue = products.reduce(
    (sum, p) => sum + p.quantity * p.sellingPrice,
    0
  );
  const shelfCostValue = products.reduce(
    (sum, p) => sum + p.quantity * p.buyingPrice,
    0
  );
  const shelfUnrealizedProfit = shelfSellingValue - shelfCostValue;

  // Sort performance array
  const performanceList = Object.values(productPerformanceMap).sort((a, b) => {
    if (sortField === 'profit') return b.profit - a.profit;
    if (sortField === 'revenue') return b.revenue - a.revenue;
    return b.unitsSold - a.unitsSold;
  });

  return (
    <div className="space-y-6">
      {/* Primary Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Confirmed Sales */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Sales</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {formatKES(totalRevenue)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Across {confirmedOrders.length} confirmed orders
          </p>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Cost of Goods (COGS)</span>
            <div className="p-1.5 bg-stone-100 rounded-lg text-stone-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-700 tracking-tight">
            {formatKES(totalCOGS)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Wholesale buying acquisition cost</p>
        </div>

        {/* Realized Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Realized Profit
            </span>
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            +{formatKES(totalProfit)}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">
            Net profit in cash drawer
          </p>
        </div>

        {/* Overall Profit Margin */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Margin</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {overallMarginPct}%
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Gross return on confirmed revenue</p>
        </div>
      </div>

      {/* Stock on Shelf Valuation Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-stone-100 p-5 rounded-xl shadow-md border border-stone-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Current Stock on Shelf Valuation</span>
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Inventory Value in Bora Hardware Yard
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Reflects all products currently physically in stock.
            </p>
          </div>

          <div className="flex items-center gap-6 divide-x divide-stone-700">
            <div>
              <span className="text-[11px] text-stone-400 block uppercase">Retail Value</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {formatKES(shelfSellingValue)}
              </span>
            </div>
            <div className="pl-6">
              <span className="text-[11px] text-stone-400 block uppercase">Stock Cost Value</span>
              <span className="text-lg font-black text-stone-300 font-mono">
                {formatKES(shelfCostValue)}
              </span>
            </div>
            <div className="pl-6">
              <span className="text-[11px] text-stone-400 block uppercase">Unrealized Profit</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                +{formatKES(shelfUnrealizedProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Product Profitability Breakdown Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Per-Product Financial Performance</h3>
            <p className="text-xs text-stone-500">
              Shows units sold, revenue generated, costs, and profit margin per product.
            </p>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 mr-1 font-medium">Sort by:</span>
            <button
              onClick={() => setSortField('profit')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortField === 'profit'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Most Profit
            </button>
            <button
              onClick={() => setSortField('revenue')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortField === 'revenue'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Highest Sales
            </button>
            <button
              onClick={() => setSortField('sold')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortField === 'sold'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Units Sold
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Hardware Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 font-mono">Gross Sales</th>
                <th className="py-3 px-4 font-mono">Total Cost</th>
                <th className="py-3 px-4 font-mono">Net Profit</th>
                <th className="py-3 px-4">Profit Margin</th>
                <th className="py-3 px-4 text-right">In Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {performanceList.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const marginPct =
                  item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0';

                return (
                  <tr key={item.productId} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      <div className="font-bold text-stone-900">{item.productName}</div>
                      {prod && (
                        <div className="text-[11px] text-stone-500 font-normal">
                          Cost: {formatKES(prod.buyingPrice)} • Price: {formatKES(prod.sellingPrice)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-900 font-mono">
                      {item.unitsSold}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {formatKES(item.revenue)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      {formatKES(item.cogs)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {item.profit > 0 ? `+${formatKES(item.profit)}` : formatKES(item.profit)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-stone-800">{marginPct}%</span>
                        <div className="w-16 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, Number(marginPct)))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-stone-800">
                        {prod ? prod.quantity : '-'}
                      </span>
                      <span className="text-[11px] text-stone-500 ml-1">
                        {prod ? prod.unit : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

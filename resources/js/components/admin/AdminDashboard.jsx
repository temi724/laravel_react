import React, { useState, useEffect } from 'react';
import AdminProductManager from './AdminProductManager.jsx';
import AdminSalesManager from './AdminSalesManager.jsx';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalDeals: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedRefundedPayments: 0,
  });
  const [monthlyComparison, setMonthlyComparison] = useState({
    products: { current: 0, previous: 0, percentage: 0 },
    deals: { current: 0, previous: 0, percentage: 0 },
    revenue: { current: 0, previous: 0, percentage: 0 },
    sales: { current: 0, previous: 0, percentage: 0 },
  });
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Utility function to abbreviate large numbers
  const abbreviateNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0';

    const num = Number(value);
    if (num < 1000) return num.toLocaleString();

    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }

    return num.toLocaleString();
  };

  // Load dashboard stats
  useEffect(() => {
    loadStats();
    loadMonthlyComparison();
    loadMonthlySalesData();
    loadTopSellingItems();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();

      if (data.success) {
        // Map the API response to match our state structure
        setStats({
          totalProducts: data.stats.products || 0,
          totalDeals: data.stats.deals || 0,
          totalSales: data.stats.total_sales || 0,
          totalRevenue: data.stats.total_revenue || 0,
          pendingOrders: data.stats.pending_orders || 0,
          completedOrders: data.stats.completed_orders || 0,
          pendingPayments: data.stats.pending_payments || 0,
          completedPayments: data.stats.completed_payments || 0,
        });
      } else {
        console.error('Error loading stats:', data.message);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyComparison = async () => {
    try {
      // Mock data for monthly comparison
      setMonthlyComparison({
        products: { percentage: 8, isPositive: true },
        deals: { percentage: 12, isPositive: true },
        revenue: { percentage: 15, isPositive: true },
        sales: { percentage: 3, isPositive: false },
      });
    } catch (error) {
      console.error('Error loading monthly comparison:', error);
    }
  };

  const loadMonthlySalesData = async () => {
    try {
      const response = await fetch('/api/admin/monthly-sales');
      const data = await response.json();

      if (data.success) {
        console.log('Monthly sales data received:', data.data);
        setMonthlySalesData(data.data);
      } else {
        console.error('Error loading monthly sales data:', data.message);
        // Fallback to mock data if API fails
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mockData = months.map((month, index) => ({
          month,
          sales: Math.floor(Math.random() * 10) + 5 + (index * 2),
          revenue: Math.floor(Math.random() * 50000) + 25000 + (index * 5000)
        }));
        console.log('Using fallback data:', mockData);
        setMonthlySalesData(mockData);
      }
    } catch (error) {
      console.error('Error loading monthly sales data:', error);
      // Fallback to mock data if API fails
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mockData = months.map((month, index) => ({
        month,
        sales: Math.floor(Math.random() * 50) + 20 + (index * 5),
        revenue: Math.floor(Math.random() * 100000) + 50000 + (index * 10000)
      }));
      setMonthlySalesData(mockData);
    }
  };

  const loadTopSellingItems = async () => {
    try {
      const response = await fetch('/api/admin/top-selling');
      const data = await response.json();

      if (data.success) {
        setTopSellingItems(data.data);
      } else {
        console.error('Error loading top selling items:', data.message);
        // Fallback to empty array if no confirmed sales
        setTopSellingItems([]);
      }
    } catch (error) {
      console.error('Error loading top selling items:', error);
      setTopSellingItems([]);
    }
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const StatsCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
          <div className="w-4 h-4 text-white" dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
            trend.isPositive
              ? 'text-emerald-700 bg-emerald-100'
              : 'text-red-700 bg-red-100'
          }`}>
            <svg className={`w-2.5 h-2.5 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <span>{trend.isPositive ? '+' : '-'}{trend.percentage}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
        <div className="text-xl font-bold text-slate-900 break-words">
          {loading ? (
            <div className="w-16 h-6 bg-slate-200 rounded animate-pulse"></div>
          ) : (
            <span className="break-all">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          )}
        </div>
        {trend && (
          <p className="text-xs text-slate-500 mt-1">
            {trend.isPositive ? 'Increase' : 'Decrease'} {trend.percentage}% from last month
          </p>
        )}
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Business Overview Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Business Overview</h2>
        <p className="text-sm text-slate-600">Key performance metrics and business insights</p>
      </div>

      {/* Business Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={monthlyComparison.products}
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>`}
        />
        <StatsCard
          title="Total Deals"
          value={stats?.totalDeals || 0}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend={monthlyComparison.deals}
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>`}
        />
        <StatsCard
          title="Total Revenue"
          value={`₦${abbreviateNumber(stats?.totalRevenue || 0)}`}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={monthlyComparison.revenue}
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>`}
        />
        <StatsCard
          title="Total Sales"
          value={stats?.totalSales || 0}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend={monthlyComparison.sales}
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>`}
        />
      </div>

      {/* Orders & Payments Section */}
      {/* <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Orders & Payments</h2>
        <p className="text-sm text-slate-600">Order fulfillment and payment processing status</p>
      </div> */}

      {/* Orders and Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>`}
        />
        <StatsCard
          title="Completed Orders"
          value={stats?.completedOrders || 0}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>`}
        />
        <StatsCard
          title="Pending Payments"
          value={stats?.pendingPayments || 0}
          color="bg-gradient-to-br from-red-500 to-red-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>`}
        />
        <StatsCard
          title="Completed Payments"
          value={stats?.completedPayments || 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>`}
        />
      </div>

      {/* Analytics & Insights Section */}
      <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Analytics & Insights</h2>
        <p className="text-sm text-slate-600">Sales trends and top-performing products</p>
      </div>

      {/* Analytics Grid - Monthly Sales Chart & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Monthly Sales Trend</h3>
            <div className="text-sm text-slate-500">Last 6 months</div>
          </div>
          <div className="h-64 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="relative h-full w-full">
                {/* Chart area */}
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="40"
                      y1={40 + (i * 32)}
                      x2="380"
                      y2={40 + (i * 32)}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-slate-200"
                    />
                  ))}

                  {/* Y-axis */}
                  <line x1="40" y1="40" x2="40" y2="168" stroke="currentColor" strokeWidth="2" className="text-slate-300"/>

                  {/* X-axis */}
                  <line x1="40" y1="168" x2="380" y2="168" stroke="currentColor" strokeWidth="2" className="text-slate-300"/>

                  {/* Line chart */}
                  {monthlySalesData.length > 1 && (
                    <>
                      {/* Sales line */}
                      <polyline
                        points={monthlySalesData.map((data, index) => {
                          const x = 60 + (index * 53);
                          const maxSales = Math.max(...monthlySalesData.map(d => d.sales));
                          const y = 168 - ((data.sales / maxSales) * 120);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data points */}
                      {monthlySalesData.map((data, index) => {
                        const x = 60 + (index * 53);
                        const maxSales = Math.max(...monthlySalesData.map(d => d.sales));
                        const y = 168 - ((data.sales / maxSales) * 120);
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#3b82f6"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="hover:r-6 cursor-pointer transition-all"
                            />
                            <title>{`${data.month}: ${data.sales} sales`}</title>
                          </g>
                        );
                      })}

                      {/* Month labels */}
                      {monthlySalesData.map((data, index) => {
                        const x = 60 + (index * 53);
                        return (
                          <text
                            key={index}
                            x={x}
                            y="185"
                            textAnchor="middle"
                            className="text-xs fill-slate-600"
                          >
                            {data.month}
                          </text>
                        );
                      })}
                    </>
                  )}
                </svg>

                {/* Trend indicator */}
                {monthlySalesData.length >= 2 && (
                  <div className="absolute top-4 right-4">
                    {(() => {
                      const firstValue = monthlySalesData[0]?.sales || 0;
                      const lastValue = monthlySalesData[monthlySalesData.length - 1]?.sales || 0;
                      const isUp = lastValue > firstValue;
                      const percentChange = firstValue > 0 ? Math.abs(((lastValue - firstValue) / firstValue) * 100).toFixed(1) : 0;

                      return (
                        <div className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-md ${
                          isUp ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
                        }`}>
                          <svg className={`w-3 h-3 ${isUp ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                          </svg>
                          <span>{isUp ? '+' : '-'}{percentChange}%</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Top Selling Items</h3>
            <div className="text-sm text-slate-500">This month (confirmed orders)</div>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                      <div className="w-20 h-3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center ${
                          item.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.quantity_sold} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">₦{abbreviateNumber(item.total_revenue)}</div>
                    <div className="text-xs text-slate-500">revenue</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500 text-sm">No confirmed sales this month</p>
                <p className="text-xs text-slate-400 mt-1">Only completed orders with confirmed payments are shown</p>
              </div>
            )}
          </div>
          {!loading && topSellingItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                View all products →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-full overflow-hidden bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your store and track performance</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 mx-6 rounded-lg">
        <div className="flex flex-wrap gap-1 p-2">
          {['overview', 'products', 'sales'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-3 px-6 text-sm font-medium capitalize transition-all duration-200 flex-shrink-0 border-b-2 rounded-lg ${
                currentTab === tab
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
      {/* Tab Content */}
      {currentTab === 'overview' && <OverviewTab />}

      {currentTab === 'products' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            {/* <div>
              <h2 className="text-2xl font-bold text-slate-900">Product Management</h2>
              <p className="text-slate-600 mt-1">Manage your product inventory and details</p>
            </div> */}
            {/* <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
              Add Product
            </button> */}
          </div>
          <AdminProductManager />
        </div>
      )}

      {currentTab === 'sales' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            {/* <div>
              <h2 className="text-2xl font-bold text-slate-900">Sales Management</h2>
              <p className="text-slate-600 mt-1">Track and manage customer orders and sales</p>
            </div> */}
          </div>
          <AdminSalesManager />
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;

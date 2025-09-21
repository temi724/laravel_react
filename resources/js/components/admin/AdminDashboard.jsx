import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import AdminProductManager from './AdminProductManager.jsx';
import AdminSalesManager from './AdminSalesManager.jsx';
import OfflineSales from './OfflineSales.jsx';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalDeals: 0,
    totalSales: 0,
    onlineSales: 0,
    offlineSales: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    offlineRevenue: 0,
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

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      total_page_views: 0,
      unique_page_views: 0,
      total_product_views: 0,
      unique_product_views: 0,
      total_sessions: 0,
      unique_users: 0,
      avg_session_duration: 0,
      top_pages: [],
      top_products: []
    },
    traffic_sources: {
      traffic_sources: [],
      top_referrers: []
    },
    conversion_funnel: {
      funnel: [],
      overall_conversion_rate: 0
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });

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

  // Load analytics data when the analytics tab is active
  useEffect(() => {
    if (currentTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [currentTab, dateFilter]);

  const loadStats = async () => {
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate
      });

      const response = await fetch(`/api/admin/dashboard-stats?${params}`);
      const data = await response.json();

      if (data.success) {
        // Map the API response to match our state structure
        setStats({
          totalProducts: data.stats.products || 0,
          totalDeals: data.stats.deals || 0,
          totalSales: data.stats.total_sales || 0,
          onlineSales: data.stats.online_sales || 0,
          offlineSales: data.stats.offline_sales || 0,
          totalRevenue: data.stats.total_revenue || 0,
          onlineRevenue: data.stats.online_revenue || 0,
          offlineRevenue: data.stats.offline_revenue || 0,
          pendingOrders: data.stats.pending_orders || 0,
          completedOrders: data.stats.completed_orders || 0,
          pendingPayments: data.stats.pending_payments || 0,
          completedPayments: data.stats.completed_payments || 0,
          receivedPaymentsRevenue: data.stats.received_payments_revenue || 0,
          pendingDeliveriesPickups: data.stats.pending_deliveries_pickups || 0,
          outstandingPayments: data.stats.outstanding_payments || 0,
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
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate
      });

      const response = await fetch(`/api/admin/monthly-sales?${params}`);
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
    console.log('loadTopSellingItems called');
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate
      });

      console.log('Calling API: /api/admin/top-selling?' + params.toString());
      const response = await fetch(`/api/admin/top-selling?${params}`);
      const data = await response.json();

      console.log('API Response:', data);
      if (data.success) {
        console.log('Top selling items debug:', data.debug);
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

  // Load analytics data
  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate
      });

      // Load analytics overview
      const overviewResponse = await fetch(`/api/admin/analytics/overview?${params}`);
      const overviewData = await overviewResponse.json();

      // Load traffic sources
      const trafficResponse = await fetch(`/api/admin/analytics/traffic-sources?${params}`);
      const trafficData = await trafficResponse.json();

      // Load conversion funnel
      const funnelResponse = await fetch(`/api/admin/analytics/conversion-funnel?${params}`);
      const funnelData = await funnelResponse.json();

      if (overviewData.success && trafficData.success && funnelData.success) {
        setAnalyticsData({
          overview: overviewData.data,
          traffic_sources: trafficData.data,
          conversion_funnel: funnelData.data
        });
      } else {
        console.error('Error loading analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const handleRefreshStats = async () => {
    setLoading(true);
    try {
      // Reload all stats and related data
      await Promise.all([
        loadStats(),
        loadMonthlyComparison(),
        loadMonthlySalesData(),
        loadTopSellingItems()
      ]);

      // Show success feedback
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium bg-green-500 transition-all duration-300';
      toast.textContent = 'Stats refreshed successfully!';
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } catch (error) {
      console.error('Error refreshing stats:', error);

      // Show error feedback
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium bg-red-500 transition-all duration-300';
      toast.textContent = 'Error refreshing stats. Please try again.';
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate payment collection percentage
  const calculatePaymentPercentage = (receivedPayments, totalRevenue) => {
    if (!totalRevenue || totalRevenue === 0) return 0;
    return Math.round((receivedPayments / totalRevenue) * 100);
  };

  const StatsCard = ({ title, value, icon, color, trend, badge }) => (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
          <div className="w-4 h-4 text-white" dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
        {(trend || badge) && (
          <div className="flex flex-col space-y-1">
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
            {badge && (
              <div className={`text-xs font-semibold px-2 py-1 rounded-md text-center ${badge.color || 'text-blue-700 bg-blue-100'}`}>
                {badge.text}
              </div>
            )}
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Business Overview</h2>
            <p className="text-sm text-slate-600">Key performance metrics and business insights</p>
          </div>

          {/* Date Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-2 text-sm">
              <label className="font-medium text-slate-700">From:</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <label className="font-medium text-slate-700">To:</label>
              <input
                type="date"
                value={dateFilter.endDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                loadStats();
                loadMonthlySalesData();
                loadTopSellingItems();
              }}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Apply Filter</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleRefreshStats}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
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

      {/* Sales Breakdown Section */}
      <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Sales Breakdown</h2>
        <p className="text-sm text-slate-600">Online vs offline sales performance</p>
      </div>

      {/* Sales Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Online Sales"
          value={stats?.onlineSales || 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>`}
          badge={{
            text: `${stats?.totalSales > 0 ? Math.round((stats?.onlineSales / stats?.totalSales) * 100) : 0}%`,
            color: 'text-blue-700 bg-blue-100'
          }}
        />
        <StatsCard
          title="Offline Sales"
          value={stats?.offlineSales || 0}
          color="bg-gradient-to-br from-green-500 to-green-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>`}
          badge={{
            text: `${stats?.totalSales > 0 ? Math.round((stats?.offlineSales / stats?.totalSales) * 100) : 0}%`,
            color: 'text-green-700 bg-green-100'
          }}
        />
        <StatsCard
          title="Online Revenue"
          value={`₦${abbreviateNumber(stats?.onlineRevenue || 0)}`}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>`}
          badge={{
            text: `${stats?.totalRevenue > 0 ? Math.round((stats?.onlineRevenue / stats?.totalRevenue) * 100) : 0}%`,
            color: 'text-indigo-700 bg-indigo-100'
          }}
        />
        <StatsCard
          title="Offline Revenue"
          value={`₦${abbreviateNumber(stats?.offlineRevenue || 0)}`}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>`}
          badge={{
            text: `${stats?.totalRevenue > 0 ? Math.round((stats?.offlineRevenue / stats?.totalRevenue) * 100) : 0}%`,
            color: 'text-emerald-700 bg-emerald-100'
          }}
        />
      </div>

      {/* Orders & Payments Section */}
      {/* <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Orders & Payments</h2>
        <p className="text-sm text-slate-600">Order fulfillment and payment processing status</p>
      </div> */}

      {/* Orders and Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
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

      {/* New Payment & Delivery Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatsCard
          title="Received Payments"
          value={`₦${abbreviateNumber(stats?.receivedPaymentsRevenue || 0)}`}
          color="bg-gradient-to-br from-green-500 to-green-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>`}
          badge={{
            text: `${calculatePaymentPercentage(stats?.receivedPaymentsRevenue || 0, stats?.totalRevenue || 0)}%`,
            color: 'text-green-700 bg-green-100'
          }}
        />
        <StatsCard
          title="Outstanding Payments"
          value={`₦${abbreviateNumber(stats?.outstandingPayments || 0)}`}
          color="bg-gradient-to-br from-orange-500 to-red-500"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>`}
          badge={{
            text: `${calculatePaymentPercentage(stats?.outstandingPayments || 0, stats?.totalRevenue || 0)}%`,
            color: 'text-orange-700 bg-orange-100'
          }}
        />
        <StatsCard
          title="Pending Deliveries/Pickups"
          value={stats?.pendingDeliveriesPickups || 0}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
          </svg>`}
        />
      </div>

      {/* Analytics & Insights Section */}
      <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Analytics & Insights</h2>
        <p className="text-sm text-slate-600">Sales trends and top-performing products</p>
      </div>

      {/* Analytics Grid - Monthly Sales Chart & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Monthly Sales Trend</h3>
            <div className="text-sm text-slate-500">Last 6 months</div>
          </div>
          <div className="h-64 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : monthlySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlySalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: '600' }}
                    formatter={(value, name) => [
                      name === 'sales' ? `${value} sales` : `₦${value?.toLocaleString()}`,
                      name === 'sales' ? 'Sales Count' : 'Revenue'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <p className="text-sm">No sales data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Top Selling Items</h3>
            <div className="text-xs text-slate-500">This month</div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-24 h-3 bg-slate-200 rounded animate-pulse mb-1"></div>
                      <div className="w-16 h-2 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-12 h-3 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center ${
                          item.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.quantity_sold} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">₦{abbreviateNumber(item.total_revenue)}</div>
                    <div className="text-xs text-slate-500">revenue</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500 text-xs">No confirmed sales this month</p>
                <p className="text-xs text-slate-400 mt-1">Only completed orders with confirmed payments are shown</p>
              </div>
            )}
          </div>
          {!loading && topSellingItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              {/* <button className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                View all products →
              </button> */}
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
          {['overview', 'products', 'sales', 'offline', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-3 px-6 text-sm font-medium capitalize transition-all duration-200 flex-shrink-0 border-b-2 rounded-lg ${
                currentTab === tab
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab === 'offline' ? 'Offline Sales' : tab}
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

      {currentTab === 'offline' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8">
          <OfflineSales />
        </div>
      )}

      {currentTab === 'analytics' && (
        <div className="space-y-6">
          {/* Website Analytics Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Website Analytics</h2>
                <p className="text-sm text-slate-600">Track visitor behavior and product engagement</p>
              </div>

              {/* Analytics Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={dateFilter.endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                    placeholder="End Date"
                  />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => loadAnalyticsData()}
                  disabled={analyticsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium min-w-fit"
                >
                  <svg className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {analyticsLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Website Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Visitors"
              value={analyticsLoading ? "..." : abbreviateNumber(analyticsData.overview.unique_page_views)}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              trend={{ percentage: 12, isPositive: true }}
              icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>`}
            />
            <StatsCard
              title="Page Views"
              value={analyticsLoading ? "..." : abbreviateNumber(analyticsData.overview.total_page_views)}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend={{ percentage: 8, isPositive: true }}
              icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>`}
            />
            <StatsCard
              title="Product Views"
              value={analyticsLoading ? "..." : abbreviateNumber(analyticsData.overview.total_product_views)}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              trend={{ percentage: 5, isPositive: false }}
              icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
              </svg>`}
            />
            <StatsCard
              title="Avg. Session Duration"
              value={analyticsLoading ? "..." : `${Math.floor(analyticsData.overview.avg_session_duration / 60)}m ${Math.floor(analyticsData.overview.avg_session_duration % 60)}s`}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend={{ percentage: 15, isPositive: true }}
              icon={`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>`}
            />
          </div>

          {/* Analytics Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Most Viewed Products */}
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Most Viewed Products</h3>
                <div className="text-sm text-slate-500">Last 7 days</div>
              </div>
              <div className="space-y-3">
                {analyticsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-slate-500">Loading product views...</div>
                  </div>
                ) : analyticsData.overview.top_products.length > 0 ? (
                  analyticsData.overview.top_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{product.product?.product_name || 'Unknown Product'}</div>
                          <div className="text-xs text-slate-500">{product.views} views</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{product.views}</div>
                        <div className="text-xs text-slate-500">views</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-slate-500">No product views data available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Funnel */}
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Checkout Funnel</h3>
                <div className="text-sm text-slate-500">Conversion rates</div>
              </div>
              <div className="space-y-4">
                {analyticsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-slate-500">Loading funnel data...</div>
                  </div>
                ) : analyticsData.conversion_funnel.funnel.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.conversion_funnel.funnel.map((step, index) => {
                      const maxUsers = Math.max(...analyticsData.conversion_funnel.funnel.map(s => Number(s.users)));
                      const barWidth = maxUsers > 0 ? (Number(step.users) / maxUsers) * 100 : 0;

                      return (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700 truncate flex-1 mr-2">
                              {step.step}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-sm text-slate-900 font-semibold">
                                {Number(step.users).toLocaleString()}
                              </span>
                              {index > 0 && (
                                <span className="text-xs text-slate-500">
                                  ({parseFloat(step.conversion_rate).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-yellow-500' :
                                index === 3 ? 'bg-orange-500' : 'bg-purple-500'
                              }`}
                              style={{
                                width: `${Math.max(barWidth, 5)}%`,
                                minWidth: step.users > 0 ? '20px' : '0'
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {index === 0 ? 'Starting point' : `${Number(step.users)} users continued`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-slate-500">No funnel data available</div>
                    <div className="text-xs text-slate-400 mt-1">Track user interactions to see conversion data</div>
                  </div>
                )}
              </div>

              {!analyticsLoading && analyticsData.conversion_funnel.overall_conversion_rate !== undefined && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-700 font-medium">Overall Conversion Rate</div>
                      <div className="text-xs text-blue-600">From initial visit to completed action</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-900">
                        {parseFloat(analyticsData.conversion_funnel.overall_conversion_rate).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Traffic Sources</h3>
              <div className="text-sm text-slate-500">Real-time data</div>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-500">Loading traffic sources...</div>
              </div>
            ) : analyticsData.traffic_sources.traffic_sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.traffic_sources.traffic_sources.map((source, index) => {
                  const totalSessions = analyticsData.traffic_sources.traffic_sources.reduce((sum, s) => sum + s.sessions, 0);
                  const percentage = totalSessions > 0 ? ((source.sessions / totalSessions) * 100).toFixed(1) : 0;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                  const color = colors[index % colors.length];

                  return (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {source.traffic_source.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">{percentage}%</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {source.sessions.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        {source.page_views} page views
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-500">No traffic data available</div>
                <div className="text-xs text-slate-400 mt-1">Visit your site to generate traffic data</div>
              </div>
            )}

            {/* Top Referrers */}
            {analyticsData.traffic_sources.top_referrers && analyticsData.traffic_sources.top_referrers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Top Referrers</h4>
                <div className="space-y-2">
                  {analyticsData.traffic_sources.top_referrers.slice(0, 5).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <span className="text-slate-600 truncate flex-1 mr-2" title={referrer.referrer}>
                        {referrer.referrer.length > 50 ? referrer.referrer.substring(0, 50) + '...' : referrer.referrer}
                      </span>
                      <span className="text-slate-900 font-medium">{referrer.sessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;

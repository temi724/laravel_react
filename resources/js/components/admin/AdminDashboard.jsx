import React, { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Box, Chart, Clock, Eye, Flash, MoneyRecive, MouseSquare, People, ReceiptItem, Refresh } from 'iconsax-react';
import AdminProductManager from './AdminProductManager.jsx';
import AdminSalesManager from './AdminSalesManager.jsx';
import OfflineSales from './OfflineSales.jsx';
import ProductImage from '../ProductImage';
import { Badge, Button, Card, DateRange, DetailList, EmptyState, SectionHeader, Skeleton, StatCard, Tabs } from './ui';
import { abbreviateNumber, api, can, percentOf, startOfMonth, today } from '../../lib/admin';
import { showToast } from '../../lib/toast';

// `needs` is the permission an admin must hold to see the tab
const TABS = [
  { id: 'overview', label: 'Overview', needs: 'reports.view' },
  { id: 'products', label: 'Products' },
  { id: 'sales', label: 'Sales', needs: 'sales.view' },
  { id: 'offline', label: 'Offline sales', needs: 'sales.offline' },
  { id: 'analytics', label: 'Analytics', needs: 'reports.view' },
];

const EMPTY_STATS = {
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
  receivedPaymentsRevenue: 0,
  pendingDeliveriesPickups: 0,
  outstandingPayments: 0,
};

const EMPTY_ANALYTICS = {
  overview: {
    total_page_views: 0,
    unique_page_views: 0,
    total_product_views: 0,
    unique_product_views: 0,
    total_sessions: 0,
    unique_users: 0,
    avg_session_duration: 0,
    top_pages: [],
    top_products: [],
  },
  traffic_sources: {
    traffic_sources: [],
    top_referrers: [],
  },
  conversion_funnel: {
    funnel: [],
    overall_conversion_rate: 0,
  },
};

const naira = (value) => `₦${abbreviateNumber(value || 0)}`;

// A numbered row with a thumbnail, used for top sellers and most viewed products
const RankedItem = ({ rank, image, name, detail, value, valueLabel }) => (
  <li className="flex items-center gap-3">
    <span className="w-4 shrink-0 text-center text-sm font-bold text-gray-400 tabular-nums">{rank}</span>
    <ProductImage src={image} className="size-11 rounded-xl" iconSize={18} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{name}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-xs text-gray-500">{valueLabel}</p>
    </div>
  </li>
);

const RankedSkeleton = () => (
  <ul className="space-y-4" aria-hidden="true">
    {[...Array(3)].map((_, i) => (
      <li key={i} className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </li>
    ))}
  </ul>
);

const AdminDashboard = () => {
  // Only the tabs this admin may use, opening on the first of them
  const tabs = TABS.filter((tab) => !tab.needs || can(tab.needs));
  const [currentTab, setCurrentTab] = useState(tabs[0].id);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: startOfMonth(),
    endDate: today(),
  });

  const loadOverview = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ start_date: dateFilter.startDate, end_date: dateFilter.endDate });

    try {
      const [statsResult, monthlyResult, topResult] = await Promise.all([
        api(`/api/admin/dashboard-stats?${params}`),
        api(`/api/admin/monthly-sales?${params}`),
        api(`/api/admin/top-selling?${params}`),
      ]);

      if (statsResult.data?.success) {
        // Map the API response to match our state structure
        const s = statsResult.data.stats;
        setStats({
          totalProducts: s.products || 0,
          totalDeals: s.deals || 0,
          totalSales: s.total_sales || 0,
          onlineSales: s.online_sales || 0,
          offlineSales: s.offline_sales || 0,
          totalRevenue: s.total_revenue || 0,
          onlineRevenue: s.online_revenue || 0,
          offlineRevenue: s.offline_revenue || 0,
          pendingOrders: s.pending_orders || 0,
          completedOrders: s.completed_orders || 0,
          pendingPayments: s.pending_payments || 0,
          completedPayments: s.completed_payments || 0,
          receivedPaymentsRevenue: s.received_payments_revenue || 0,
          pendingDeliveriesPickups: s.pending_deliveries_pickups || 0,
          outstandingPayments: s.outstanding_payments || 0,
        });
      }

      setMonthlySalesData(monthlyResult.data?.success ? monthlyResult.data.data || [] : []);
      setTopSellingItems(topResult.data?.success ? topResult.data.data || [] : []);
      setLoadFailed(!statsResult.data?.success);
      return Boolean(statsResult.data?.success);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoadFailed(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  const loadAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    const params = new URLSearchParams({ start_date: dateFilter.startDate, end_date: dateFilter.endDate });

    try {
      const [overview, traffic, funnel] = await Promise.all([
        api(`/api/admin/analytics/overview?${params}`),
        api(`/api/admin/analytics/traffic-sources?${params}`),
        api(`/api/admin/analytics/conversion-funnel?${params}`),
      ]);

      if (overview.data?.success && traffic.data?.success && funnel.data?.success) {
        setAnalyticsData({
          overview: overview.data.data,
          traffic_sources: traffic.data.data,
          conversion_funnel: funnel.data.data,
        });
      } else {
        console.error('Error loading analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateFilter]);

  // The overview follows the date range
  useEffect(() => {
    if (can('reports.view')) loadOverview();
  }, [loadOverview]);

  // Load analytics data when the analytics tab is active
  useEffect(() => {
    if (currentTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [currentTab, loadAnalyticsData]);

  const handleRefresh = async () => {
    let ok = true;
    if (currentTab === 'analytics') {
      await loadAnalyticsData();
    } else {
      ok = await loadOverview();
    }
    showToast(ok ? 'Figures refreshed' : 'Could not refresh. Try again.', ok ? 'success' : 'error');
  };

  const rangeControls = (
    <>
      <DateRange value={dateFilter} onChange={setDateFilter} />
      <Button variant="secondary" size="sm" icon={Refresh} loading={currentTab === 'analytics' ? analyticsLoading : loading} onClick={handleRefresh}>
        Refresh
      </Button>
    </>
  );

  const onlineShare = percentOf(stats.onlineSales, stats.totalSales);
  const collected = percentOf(stats.receivedPaymentsRevenue, stats.totalRevenue);
  const analytics = analyticsData.overview;
  const funnel = analyticsData.conversion_funnel.funnel || [];
  const funnelMax = Math.max(0, ...funnel.map((step) => Number(step.users)));
  const sources = analyticsData.traffic_sources.traffic_sources || [];
  const totalSessions = sources.reduce((sum, source) => sum + Number(source.sessions), 0);
  const referrers = analyticsData.traffic_sources.top_referrers || [];

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} value={currentTab} onChange={setCurrentTab} label="Dashboard sections" />

      {/* Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <SectionHeader as="h2" title="Business overview" description="Sales, orders and payments for the selected dates." actions={rangeControls} />

          {loadFailed && (
            <Card>
              <EmptyState
                title="We could not load the figures"
                description="Check your connection and try again."
                action={
                  <Button icon={Refresh} onClick={loadOverview}>
                    Try again
                  </Button>
                }
              />
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Revenue" value={naira(stats.totalRevenue)} icon={MoneyRecive} loading={loading} />
            <StatCard label="Sales" value={stats.totalSales.toLocaleString('en-NG')} icon={ReceiptItem} loading={loading} />
            <StatCard label="Products added" value={stats.totalProducts.toLocaleString('en-NG')} icon={Box} loading={loading} />
            <StatCard label="Deals added" value={stats.totalDeals.toLocaleString('en-NG')} icon={Flash} loading={loading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <SectionHeader as="h3" title="Online and offline" />
              {/* Share of sales made online, with the rest made in store */}
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                <div className="bg-brand transition-[width] duration-300 ease-out" style={{ width: `${onlineShare}%` }} />
              </div>
              <DetailList
                className="mt-4"
                items={[
                  { label: 'Online sales', value: `${stats.onlineSales.toLocaleString('en-NG')} (${onlineShare}%)` },
                  { label: 'Online revenue', value: naira(stats.onlineRevenue) },
                  { label: 'Offline sales', value: `${stats.offlineSales.toLocaleString('en-NG')} (${stats.totalSales > 0 ? 100 - onlineShare : 0}%)` },
                  { label: 'Offline revenue', value: naira(stats.offlineRevenue) },
                ]}
              />
            </Card>

            <Card>
              <SectionHeader as="h3" title="Orders" />
              <DetailList
                className="mt-4"
                items={[
                  { label: 'Pending', value: <Badge tone={stats.pendingOrders > 0 ? 'warning' : 'neutral'}>{stats.pendingOrders}</Badge> },
                  { label: 'Completed', value: <Badge tone="success">{stats.completedOrders}</Badge> },
                  { label: 'Paid, awaiting delivery or pickup', value: <Badge tone={stats.pendingDeliveriesPickups > 0 ? 'warning' : 'neutral'}>{stats.pendingDeliveriesPickups}</Badge> },
                ]}
              />
            </Card>

            <Card>
              <SectionHeader as="h3" title="Payments" />
              <DetailList
                className="mt-4"
                items={[
                  { label: 'Pending', value: <Badge tone={stats.pendingPayments > 0 ? 'warning' : 'neutral'}>{stats.pendingPayments}</Badge> },
                  { label: 'Completed', value: <Badge tone="success">{stats.completedPayments}</Badge> },
                  { label: 'Received', value: `${naira(stats.receivedPaymentsRevenue)} (${collected}%)` },
                  { label: 'Outstanding', value: naira(stats.outstandingPayments) },
                ]}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Monthly sales chart */}
            <Card className="lg:col-span-2">
              <SectionHeader as="h3" title="Sales per month" description="Number of sales in each month." />
              <div className="mt-4 h-64">
                {loading ? (
                  <Skeleton className="size-full rounded-2xl" />
                ) : monthlySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySalesData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6a7282' }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6a7282' }} tickFormatter={(value) => value.toLocaleString()} />
                      <Tooltip
                        cursor={{ stroke: '#d1d5dc' }}
                        contentStyle={{ backgroundColor: '#14171c', border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '12px' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                        formatter={(value, name) => [name === 'sales' ? `${value} sales` : `₦${Number(value).toLocaleString()}`, name === 'sales' ? 'Sales' : 'Revenue']}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#2251f5"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#2251f5', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#2251f5', strokeWidth: 2, stroke: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState className="h-full justify-center" icon={Chart} title="No sales in these dates" description="Sales will be charted here as orders come in." />
                )}
              </div>
            </Card>

            {/* Top selling items */}
            <Card>
              <SectionHeader as="h3" title="Top selling" description="Completed, paid orders only." />
              <div className="mt-4">
                {loading ? (
                  <RankedSkeleton />
                ) : topSellingItems.length > 0 ? (
                  <ul className="space-y-4">
                    {topSellingItems.map((item, index) => (
                      <RankedItem
                        key={item.id || item.name}
                        rank={index + 1}
                        image={item.image}
                        name={item.name}
                        detail={`${item.quantity_sold} sold`}
                        value={naira(item.total_revenue)}
                        valueLabel="revenue"
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState className="py-6" title="No confirmed sales yet" description="Items appear here once an order is paid and completed." />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {currentTab === 'products' && <AdminProductManager />}

      {currentTab === 'sales' && <AdminSalesManager />}

      {currentTab === 'offline' && <OfflineSales />}

      {/* Website analytics */}
      {currentTab === 'analytics' && (
        <div className="space-y-6">
          <SectionHeader as="h2" title="Website analytics" description="What visitors look at, and how far they get towards buying." actions={rangeControls} />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Visitors" value={abbreviateNumber(analytics.unique_page_views)} icon={People} loading={analyticsLoading} />
            <StatCard label="Page views" value={abbreviateNumber(analytics.total_page_views)} icon={Eye} loading={analyticsLoading} />
            <StatCard label="Product views" value={abbreviateNumber(analytics.total_product_views)} icon={MouseSquare} loading={analyticsLoading} />
            <StatCard
              label="Average visit"
              value={`${Math.floor(analytics.avg_session_duration / 60)}m ${Math.floor(analytics.avg_session_duration % 60)}s`}
              icon={Clock}
              loading={analyticsLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Most viewed products */}
            <Card>
              <SectionHeader as="h3" title="Most viewed products" />
              <div className="mt-4">
                {analyticsLoading ? (
                  <RankedSkeleton />
                ) : analytics.top_products.length > 0 ? (
                  <ul className="space-y-4">
                    {analytics.top_products.map((product, index) => (
                      <RankedItem
                        key={product.product_id || index}
                        rank={index + 1}
                        image={product.product?.images_url?.[0]}
                        name={product.product?.product_name || 'Deal or removed product'}
                        detail={`ID ${product.product_id}`}
                        value={Number(product.views).toLocaleString('en-NG')}
                        valueLabel="views"
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState className="py-6" title="No product views yet" description="Views are counted when someone opens a product page." />
                )}
              </div>
            </Card>

            {/* Checkout funnel */}
            <Card>
              <SectionHeader
                as="h3"
                title="Checkout funnel"
                actions={
                  !analyticsLoading &&
                  funnel.length > 0 && <Badge tone="brand">{parseFloat(analyticsData.conversion_funnel.overall_conversion_rate || 0).toFixed(1)}% overall</Badge>
                }
              />
              <div className="mt-4">
                {analyticsLoading ? (
                  <div className="space-y-4" aria-hidden="true">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-xl" />
                    ))}
                  </div>
                ) : funnel.length > 0 ? (
                  <ol className="space-y-4">
                    {funnel.map((step, index) => {
                      const users = Number(step.users);
                      return (
                        <li key={step.step}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-semibold">{step.step}</span>
                            <span className="shrink-0 tabular-nums">
                              <span className="font-bold">{users.toLocaleString('en-NG')}</span>
                              {index > 0 && <span className="ml-2 text-gray-500">{parseFloat(step.conversion_rate).toFixed(1)}%</span>}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                            <div className="h-2 rounded-full bg-brand transition-[width] duration-300 ease-out" style={{ width: `${funnelMax > 0 ? (users / funnelMax) * 100 : 0}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <EmptyState className="py-6" title="No funnel data yet" description="It fills in as visitors add to cart and check out." />
                )}
              </div>
            </Card>
          </div>

          {/* Traffic sources */}
          <Card>
            <SectionHeader as="h3" title="Traffic sources" description="Where visits came from." />
            <div className="mt-4">
              {analyticsLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : sources.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sources.map((source) => (
                    <div key={source.traffic_source} className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold capitalize">{String(source.traffic_source || 'unknown').replace(/_/g, ' ')}</p>
                        <Badge>{percentOf(Number(source.sessions), totalSessions)}%</Badge>
                      </div>
                      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{Number(source.sessions).toLocaleString('en-NG')}</p>
                      <p className="text-xs text-gray-500">
                        visits, {Number(source.page_views).toLocaleString('en-NG')} page views
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState className="py-6" title="No traffic recorded yet" description="Visits to the store show up here." />
              )}

              {/* Top referrers */}
              {referrers.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold">Top referrers</h4>
                  <ul className="mt-3 space-y-2">
                    {referrers.slice(0, 5).map((referrer) => (
                      <li key={referrer.referrer} className="flex items-center justify-between gap-4 text-sm">
                        <span className="truncate text-gray-600" title={referrer.referrer}>
                          {referrer.referrer}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{referrer.sessions}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { Suspense, lazy } from 'react';

// Shown while an admin screen's code is being fetched
const AdminLoadingSpinner = () => (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="h-10 w-72 animate-pulse rounded-full bg-gray-200/70" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200/70" />
    </div>
);

// Lazy load admin components
const AdminLogin = lazy(() => import('./AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));
const AdminProductManager = lazy(() => import('./AdminProductManager.jsx'));
const AdminSalesManager = lazy(() => import('./AdminSalesManager.jsx'));
const AdminOrderManager = lazy(() => import('./AdminOrderManager.jsx'));
const OfflineSales = lazy(() => import('./OfflineSales.jsx'));
const AdminCategories = lazy(() => import('./AdminCategories.jsx'));
const AdminSettings = lazy(() => import('./AdminSettings.jsx'));
const AdminOffers = lazy(() => import('./AdminOffers.jsx'));

// Wrapper components with Suspense
export const LazyAdminLogin = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminLogin {...props} />
    </Suspense>
);

export const LazyAdminDashboard = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminDashboard {...props} />
    </Suspense>
);

export const LazyAdminProductManager = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminProductManager {...props} />
    </Suspense>
);

export const LazyAdminSalesManager = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminSalesManager {...props} />
    </Suspense>
);

export const LazyAdminOrderManager = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminOrderManager {...props} />
    </Suspense>
);

export const LazyOfflineSales = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <OfflineSales {...props} />
    </Suspense>
);

export const LazyAdminCategories = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminCategories {...props} />
    </Suspense>
);

export const LazyAdminSettings = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminSettings {...props} />
    </Suspense>
);

export const LazyAdminOffers = (props) => (
    <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminOffers {...props} />
    </Suspense>
);

// Default exports for direct import
export {
    AdminLogin,
    AdminDashboard,
    AdminProductManager,
    AdminSalesManager,
    AdminOrderManager
};

import React, { Suspense, lazy } from 'react';

// Loading component for admin components
const AdminLoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-lg text-gray-600">Loading admin panel...</span>
    </div>
);

// Lazy load admin components
const AdminLogin = lazy(() => import('./AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));
const AdminProductManager = lazy(() => import('./AdminProductManager.jsx'));
const AdminSalesManager = lazy(() => import('./AdminSalesManager.jsx'));
const AdminOrderManager = lazy(() => import('./AdminOrderManager.jsx'));
const OfflineSales = lazy(() => import('./OfflineSales.jsx'));

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

// Default exports for direct import
export {
    AdminLogin,
    AdminDashboard,
    AdminProductManager,
    AdminSalesManager,
    AdminOrderManager
};

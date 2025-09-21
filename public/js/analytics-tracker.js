/**
 * Analytics Tracking System
 * Captures page visits, product views, user sessions, and checkout events
 */

class AnalyticsTracker {
    constructor() {
        console.log('Analytics: Initializing Analytics Tracker');
        this.sessionId = this.getOrCreateSessionId();
        this.userId = this.getUserId();
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 0,
            lastActivity: Date.now()
        };

        console.log('Analytics: Session ID:', this.sessionId, 'User ID:', this.userId);
        this.init();
    }

    init() {
        // Start session tracking
        this.startSession();

        // Track page views automatically
        this.trackPageView();

        // Set up event listeners
        this.setupEventListeners();

        // Update session activity periodically
        this.startActivityTracking();

        // Handle page unload
        this.setupUnloadHandler();
    }

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    getUserId() {
        // Try to get user ID from various sources
        return localStorage.getItem('user_id') ||
               document.querySelector('[data-user-id]')?.getAttribute('data-user-id') ||
               null;
    }

    getTrafficSource() {
        const referrer = document.referrer;
        const url = new URL(window.location.href);
        const utm_source = url.searchParams.get('utm_source');
        const utm_medium = url.searchParams.get('utm_medium');

        if (utm_source) {
            return utm_source;
        } else if (referrer) {
            const referrerDomain = new URL(referrer).hostname;
            if (referrerDomain.includes('google')) return 'google';
            if (referrerDomain.includes('facebook')) return 'facebook';
            if (referrerDomain.includes('instagram')) return 'instagram';
            if (referrerDomain.includes('twitter')) return 'twitter';
            return 'referral';
        } else {
            return 'direct';
        }
    }

    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Unknown';
    }

    async startSession() {
        try {
            const sessionData = {
                session_id: this.sessionId,
                user_id: this.userId,
                ip_address: null, // Will be determined server-side
                user_agent: navigator.userAgent,
                country: null, // Will be determined server-side
                city: null, // Will be determined server-side
                device_type: this.getDeviceType(),
                browser: this.getBrowser(),
                traffic_source: this.getTrafficSource(),
                referrer: document.referrer || null,
                page_views: 0,
                total_duration: 0,
                last_activity: new Date().toISOString()
            };

            // Create or update session
            await this.sendAnalyticsData('/api/analytics/session', sessionData);
        } catch (error) {
            console.error('Error starting session:', error);
        }
    }

    async trackPageView() {
        try {
            this.sessionData.pageViews++;
            this.sessionData.lastActivity = Date.now();

            const pageData = {
                page_url: window.location.href,
                page_title: document.title,
                user_agent: navigator.userAgent,
                ip_address: null, // Will be determined server-side
                referrer: document.referrer || null,
                session_id: this.sessionId,
                user_id: this.userId,
                country: null, // Will be determined server-side
                city: null, // Will be determined server-side
                duration: 0 // Will be updated when leaving page
            };

            await this.sendAnalyticsData('/api/analytics/page-visit', pageData);
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    }

    async trackProductView(productId, productName = null) {
        try {
            console.log('Analytics: Tracking product view for product ID:', productId, 'Name:', productName);

            const productData = {
                product_id: productId,
                session_id: this.sessionId,
                user_id: this.userId,
                ip_address: null, // Will be determined server-side
                referrer: document.referrer || null,
                viewed_at: new Date().toISOString()
            };

            console.log('Analytics: Sending product view data:', productData);
            const response = await this.sendAnalyticsData('/api/analytics/product-view', productData);
            console.log('Analytics: Product view response:', response);
        } catch (error) {
            console.error('Error tracking product view:', error);
        }
    }

    async trackCheckoutEvent(eventType, productData = null, value = null) {
        try {
            const checkoutData = {
                session_id: this.sessionId,
                event_type: eventType, // cart_view, checkout_start, payment_info, purchase
                product_id: productData?.id || null,
                value: value,
                product_data: productData,
                currency: 'NGN'
            };

            await this.sendAnalyticsData('/api/analytics/checkout-event', checkoutData);
        } catch (error) {
            console.error('Error tracking checkout event:', error);
        }
    }

    setupEventListeners() {
        // Track product views on product pages
        if (window.location.pathname.includes('/product/')) {
            const productId = this.extractProductId();
            if (productId) {
                this.trackProductView(productId);
            }
        }

        // Track cart views
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-track="cart-view"]') ||
                e.target.closest('[data-track="cart-view"]')) {
                this.trackCheckoutEvent('cart_view');
            }
        });

        // Track checkout starts
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-track="checkout-start"]') ||
                e.target.closest('[data-track="checkout-start"]')) {
                this.trackCheckoutEvent('checkout_start');
            }
        });

        // Track add to cart events
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-track="add-to-cart"]') ||
                e.target.closest('[data-track="add-to-cart"]')) {
                const productElement = e.target.closest('[data-product-id]');
                if (productElement) {
                    const productId = productElement.getAttribute('data-product-id');
                    const productName = productElement.getAttribute('data-product-name');
                    const productPrice = productElement.getAttribute('data-product-price');

                    this.trackCheckoutEvent('cart_view', {
                        id: productId,
                        name: productName,
                        price: productPrice
                    });
                }
            }
        });
    }

    extractProductId() {
        // Try multiple methods to extract product ID
        const urlParts = window.location.pathname.split('/');
        const productIndex = urlParts.indexOf('product');
        if (productIndex !== -1 && urlParts[productIndex + 1]) {
            return urlParts[productIndex + 1];
        }

        // Check for data attributes
        const productElement = document.querySelector('[data-product-id]');
        if (productElement) {
            return productElement.getAttribute('data-product-id');
        }

        return null;
    }

    startActivityTracking() {
        // Update session activity every 30 seconds
        setInterval(() => {
            this.updateSessionActivity();
        }, 30000);

        // Track user activity
        ['click', 'scroll', 'keypress', 'mousemove'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.sessionData.lastActivity = Date.now();
            }, { passive: true });
        });
    }

    async updateSessionActivity() {
        try {
            const duration = Math.floor((Date.now() - this.sessionData.startTime) / 1000);

            const updateData = {
                session_id: this.sessionId,
                page_views: this.sessionData.pageViews,
                total_duration: duration,
                last_activity: new Date().toISOString()
            };

            await this.sendAnalyticsData('/api/analytics/session-update', updateData);
        } catch (error) {
            console.error('Error updating session activity:', error);
        }
    }

    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            // Calculate time spent on current page
            const timeSpent = Math.floor((Date.now() - this.sessionData.lastActivity) / 1000);

            // Send final session update
            navigator.sendBeacon('/api/analytics/session-end', JSON.stringify({
                session_id: this.sessionId,
                duration: timeSpent
            }));
        });
    }

    async sendAnalyticsData(endpoint, data) {
        try {
            console.log('Analytics: Sending data to', endpoint, 'with data:', data);

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            console.log('Analytics: CSRF token found:', csrfToken ? 'Yes' : 'No');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(data)
            });

            console.log('Analytics: Response status:', response.status);

            if (!response.ok) {
                const responseText = await response.text();
                console.warn('Analytics request failed:', response.status, responseText);
            } else {
                const responseData = await response.json();
                console.log('Analytics: Success response:', responseData);
            }
        } catch (error) {
            console.error('Error sending analytics data:', error);
        }
    }

    // Public methods for manual tracking
    trackCustomEvent(eventType, data = {}) {
        this.trackCheckoutEvent(eventType, data);
    }

    trackPurchase(orderData) {
        this.trackCheckoutEvent('purchase', orderData, orderData.total);
    }

    trackPaymentInfo(paymentData) {
        this.trackCheckoutEvent('payment_info', paymentData);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Analytics: DOM loaded, initializing tracker');
    window.analyticsTracker = new AnalyticsTracker();
    console.log('Analytics: Tracker initialized and assigned to window.analyticsTracker');

    // Test the tracking immediately
    setTimeout(() => {
        console.log('Analytics: Running test tracking...');
        if (window.trackProductView) {
            console.log('Analytics: trackProductView function is available');
        } else {
            console.error('Analytics: trackProductView function is NOT available');
        }
    }, 1000);
});

// Expose global functions for manual tracking
window.trackProductView = (productId, productName) => {
    console.log('Analytics: Global trackProductView called with:', productId, productName);
    if (window.analyticsTracker) {
        window.analyticsTracker.trackProductView(productId, productName);
    } else {
        console.error('Analytics: Tracker not initialized yet');
    }
};

window.trackCheckoutEvent = (eventType, productData, value) => {
    if (window.analyticsTracker) {
        window.analyticsTracker.trackCheckoutEvent(eventType, productData, value);
    }
};

window.trackPurchase = (orderData) => {
    if (window.analyticsTracker) {
        window.analyticsTracker.trackPurchase(orderData);
    }
};

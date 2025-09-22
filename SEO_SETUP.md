# SEO Setup Instructions

## 1. Google Search Console Verification
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (yourdomain.com)
3. Choose "HTML tag" verification method
4. Copy the content value and replace `YOUR_GOOGLE_VERIFICATION_CODE_HERE` in layout.blade.php

## 2. Google Analytics Setup
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property for your website
3. Get your Measurement ID (starts with G-XXXXXXXXXX)
4. Replace `YOUR_GA_MEASUREMENT_ID` in layout.blade.php (appears twice)

## 3. Update Social Media Links
Replace the placeholder social media URLs in the schema markup with your actual profiles.

## 4. Submit Sitemap
- Submit your sitemap URL to Google Search Console and Bing Webmaster Tools
- Sitemap URL: https://yourdomain.com/sitemap.xml

## 5. Additional SEO Tasks
- Set up Google Tag Manager (optional but recommended)
- Add proper alt tags to all images
- Ensure HTTPS is enabled
- Set up proper 404 and 500 error pages
- Add breadcrumb navigation
- Optimize page load speed
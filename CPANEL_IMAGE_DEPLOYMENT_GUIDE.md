# cPanel Deployment Guide for Image Storage & File Uploads

## 🚨 **CRITICAL LIVEWIRE UPLOAD FIX**

### **File Upload Error Fix**
If you get this error on cPanel:
```
MethodNotAllowedHttpException - Method Not Allowed
The GET method is not supported for route livewire/upload-file. Supported methods: POST.
```

✅ **This has been FIXED in your codebase with:**
1. **Updated `config/livewire.php`** - Configured for cPanel compatibility
2. **Updated `public/.htaccess`** - Added Livewire route protection
3. **Server-specific configuration** - Optimized for shared hosting

### **500 Internal Server Error Fix**
If you get a **500 error** when uploading files:
```
POST /livewire/upload-file 500 (Internal Server Error)
```

✅ **SOLUTION: Create missing directories on cPanel:**
```bash
# Via cPanel Terminal or SSH:
mkdir -p storage/app/livewire-tmp
chmod 755 storage/app/livewire-tmp
chmod 755 storage/app/public/products
```

## 🚀 Steps to Deploy Your Laravel App with Working Images on cPanel

### **1. Upload Files to cPanel**
- Upload all files to your cPanel hosting
- Usually goes in `public_html` or `domains/yourdomain.com/public_html`

### **2. Create Required Directories (CRITICAL)**
Create these directories via cPanel File Manager or Terminal:
```bash
mkdir -p storage/app/livewire-tmp
mkdir -p storage/app/public/products
chmod 755 storage/app/livewire-tmp
chmod 755 storage/app/public/products
```

### **3. Fix Storage Symlink (CRITICAL)**
The symlink `public/storage` won't work after upload. You MUST recreate it:

#### Option A: Via cPanel Terminal (if available)
```bash
cd public_html  # or wherever your app is
rm public/storage  # remove the old symlink
php artisan storage:link  # recreate the symlink
```

#### Option B: Via cPanel File Manager
1. Go to File Manager
2. Navigate to your app's root directory
3. Delete the `public/storage` folder/link
4. Create a new symbolic link:
   - **Link Path:** `public/storage`
   - **Target:** `../storage/app/public`

#### Option C: Manual Creation (if symlinks don't work)
If symlinks don't work, create the directory structure:
```bash
mkdir public/storage
mkdir public/storage/products
cp storage/app/public/products/* public/storage/products/
```

### **4. Update Environment Variables**
Edit your `.env` file on cPanel:

```env
APP_URL=https://store.murphylog.com.ng
# Replace with your actual domain
```

### **5. Set File Permissions**
Set these permissions via cPanel File Manager:
- `storage/` directory: 755
- `storage/app/public/products/` directory: 755
- `storage/app/livewire-tmp/` directory: 755
- `storage/logs/` directory: 755
- Image files: 644

### **6. Clear Laravel Cache**
Run these commands via terminal or create a temporary PHP file:
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### **6. Test Image Access**
After deployment, test if images are accessible:
- Visit: `https://yourdomain.com/storage/products/[filename].jpg`
- Should display the image directly

## 🔧 **Alternative Solution (If Symlinks Fail)**

If symlinks don't work on your cPanel, here's a backup plan:

### Create a Route-Based Image Server
Add this to your `routes/web.php`:

```php
Route::get('/storage/products/{filename}', function ($filename) {
    $path = storage_path('app/public/products/' . $filename);
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    return response()->file($path);
})->where('filename', '.*\.(jpg|jpeg|png|gif|svg)$');
```

This serves images directly from storage without requiring symlinks.

## 📱 **Testing Your Deployment**

1. **Upload a new product with images**
2. **Check if images display in the product list**
3. **Verify image URLs are accessible**
4. **Test on mobile devices**

## ⚠️ **Common cPanel Issues & Fixes**

### Issue: "Storage symlink not working"
**Fix:** Use Option B or C above

### Issue: "Images not loading"
**Fix:** Check file permissions and APP_URL

### Issue: "404 errors on images"
**Fix:** Verify symlink and storage structure

### Issue: "Images work locally but not on live site"
**Fix:** Update APP_URL and recreate symlink

### Issue: "500 Internal Server Error on File Upload"
**Cause:** Two issues need to be fixed:
1. Missing `storage/app/livewire-tmp/` directory
2. Missing `cache` table in database

**Fix Step 1 - Create livewire-tmp directory:**

**Method 1 - cPanel File Manager:**
1. Login to cPanel → File Manager
2. Navigate to your Laravel root directory
3. Go to `storage/app/`
4. Create new folder: `livewire-tmp`
5. Set permissions to `755`

**Method 2 - cPanel Terminal (if available):**
```bash
mkdir -p storage/app/livewire-tmp
chmod 755 storage/app/livewire-tmp
```

**Fix Step 2 - Run database migrations:**

**Method 1 - cPanel Terminal (if available):**
```bash
cd /path/to/your/laravel/app
php artisan migrate
```

**Method 2 - Upload migration manually:**
If you can't run artisan commands, create these tables in your database:

```sql
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
);

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
);
```

**Why this happens:** 
1. Livewire needs the directory to store temporary upload files
2. Laravel uses the cache table for rate limiting upload requests

### Issue: "Class 'finfo' not found"
**Cause:** Missing `fileinfo` PHP extension on cPanel server
**Fix:** Enable the fileinfo extension in cPanel

**Method 1 - cPanel PHP Extensions:**
1. Login to cPanel → Software → Select PHP Version
2. Click "Extensions" tab
3. Find and enable `fileinfo` extension
4. Click "Save"

**Method 2 - Contact Hosting Provider:**
If you can't enable extensions yourself, contact your hosting provider to enable the `fileinfo` PHP extension.

**Method 3 - Alternative Configuration:**
Add this to your `config/livewire.php` (temporary workaround):
```php
'temporary_file_upload' => [
    'disk' => 'local',
    'rules' => 'file|max:12288', // 12MB max
    'directory' => 'livewire-tmp',
    'middleware' => 'web',
    'preview_mimes' => [
        'png', 'gif', 'bmp', 'svg', 'wav', 'mp4',
        'mov', 'avi', 'wmv', 'mp3', 'm4a', 'jpg', 'jpeg'
    ],
],
```

**Why this happens:** The `fileinfo` extension is required for Laravel to detect file types during upload. Without it, Livewire can't process files properly.

## 🎯 **Quick Checklist**
- [ ] Files uploaded to cPanel
- [ ] Storage symlink recreated
- [ ] APP_URL updated in .env
- [ ] File permissions set (755/644)
- [ ] Laravel cache cleared
- [ ] Test image access

## 📞 **If You Need Help**
If symlinks still don't work, the route-based solution will definitely work as a fallback!

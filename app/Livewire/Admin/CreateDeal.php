<?php

namespace App\Livewire\Admin;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\WithFileUploads;
use App\Models\Deal;
use App\Models\Category;
use Illuminate\Support\Str;

#[Layout('components.admin-layout')]
class CreateDeal extends Component
{
    use WithFileUploads;

    // Form fields
    public $product_name = '';
    public $price = '';
    public $old_price = '';
    public $category_id = '';
    public $overview = '';
    public $description = '';
    public $about = '';
    public $reviews = '';
    public $what_is_included = '';
    public $in_stock = false;
    public $out_of_stock = false;
    public $images_url = '';
    public $colors = '';
    public $specification = '';
    public $product_status = 'new';
    public $storage_options = [];
    public $has_storage = false;

    // Image upload properties
    public $product_images = [];
    public $uploaded_image_urls = [];

    protected $rules = [
        'product_name' => 'required|min:3',
        'price' => 'required|numeric|min:0',
        'old_price' => 'nullable|numeric|min:0',
        'category_id' => 'required|exists:categories,id',
        'overview' => 'nullable|min:10',
        'description' => 'required|min:10',
        'about' => 'nullable|min:10',
        'reviews' => 'nullable|string',
        'what_is_included' => 'nullable|string',
        'in_stock' => 'nullable|boolean',
        'out_of_stock' => 'nullable|boolean',
        'product_status' => 'required|in:new,uk_used,refurbished',
        'has_storage' => 'boolean',
        'storage_options.*.storage' => 'required_if:has_storage,true|string|min:1',
        'storage_options.*.price' => 'required_if:has_storage,true|numeric|min:0',
        // Image validation rules
        'product_images.*' => 'nullable|image|mimes:jpg,jpeg|max:2048|dimensions:min_width=100,min_height=100,max_width=4000,max_height=4000',
        'product_images' => 'nullable|image|mimes:jpg,jpeg|max:2048|dimensions:min_width=100,min_height=100,max_width=4000,max_height=4000',
    ];

    public function mount()
    {
        // Initialize with one empty storage option
        $this->storage_options = [
            ['storage' => '', 'price' => '']
        ];
    }

    public function addStorageOption()
    {
        $this->storage_options[] = ['storage' => '', 'price' => ''];
    }

    public function removeStorageOption($index)
    {
        if (count($this->storage_options) > 1) {
            unset($this->storage_options[$index]);
            $this->storage_options = array_values($this->storage_options);
        }
    }

    public function updatedHasStorage()
    {
        if (!$this->has_storage) {
            $this->storage_options = [];
        } else if (empty($this->storage_options)) {
            $this->storage_options = [
                ['storage' => '', 'price' => '']
            ];
        }
    }

    // Image handling methods
    public function updatedProductImages()
    {
        if ($this->product_images) {
            $this->validate([
                'product_images' => 'image|mimes:jpg,jpeg|max:2048|dimensions:min_width=100,min_height=100,max_width=4000,max_height=4000'
            ]);

            // Since we're adding one image at a time, this should work
            session()->flash('success', 'Image added! (' . count($this->product_images) . '/3)');
        }
    }

    public function removeImage($index)
    {
        if (isset($this->product_images[$index])) {
            unset($this->product_images[$index]);
            $this->product_images = array_values($this->product_images);
        }

        if (isset($this->uploaded_image_urls[$index])) {
            unset($this->uploaded_image_urls[$index]);
            $this->uploaded_image_urls = array_values($this->uploaded_image_urls);
        }
    }

    private function uploadImages()
    {
        $imageUrls = [];

        foreach ($this->product_images as $image) {
            if ($image && $this->isValidImage($image)) {
                $filename = $this->generateSecureFilename();
                $path = $this->handleSecureImageUpload($image, $filename);
                $imageUrls[] = asset('images/products/' . $filename);
            }
        }

        return $imageUrls;
    }

    private function isValidImage($file)
    {
        // Check MIME type
        $allowedMimes = ['image/jpeg', 'image/jpg'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return false;
        }

        // Check if it's actually an image
        $tempPath = $file->getRealPath();
        $imageInfo = getimagesize($tempPath);
        if ($imageInfo === false) {
            return false;
        }

        // Check image type
        if (!in_array($imageInfo[2], [IMAGETYPE_JPEG])) {
            return false;
        }

        // Scan for malicious content
        return $this->scanImageContent($file);
    }

    private function scanImageContent($file)
    {
        $content = file_get_contents($file->getRealPath());

        $maliciousPatterns = [
            '/<\?php/i',
            '/<script/i',
            '/eval\(/i',
            '/base64_decode/i',
            '/exec\(/i',
            '/system\(/i',
            '/shell_exec/i',
            '/passthru/i',
        ];

        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return false;
            }
        }

        return true;
    }

    private function generateSecureFilename()
    {
        return Str::random(40) . '.jpg';
    }

    private function handleSecureImageUpload($file, $filename)
    {
        $uploadPath = public_path('images/products');

        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        $this->reencodeImage($file, $uploadPath . '/' . $filename);

        return 'images/products/' . $filename;
    }

    private function reencodeImage($file, $destination)
    {
        $image = imagecreatefromjpeg($file->getRealPath());

        if ($image === false) {
            throw new \Exception('Invalid JPEG file');
        }

        imagejpeg($image, $destination, 85);
        imagedestroy($image);
    }

    public function createDeal()
    {
        $this->validate();

        // Upload images and get URLs
        $uploadedImageUrls = [];
        if (!empty($this->product_images)) {
            $uploadedImageUrls = $this->uploadImages();
        }

        // Combine uploaded images with manually entered URLs
        $allImageUrls = array_merge($uploadedImageUrls, $this->uploaded_image_urls);
        if (!empty($this->images_url)) {
            $manualUrls = array_filter(explode("\n", $this->images_url));
            $allImageUrls = array_merge($allImageUrls, $manualUrls);
        }

        // Prepare storage options data
        $storageOptionsData = null;
        if ($this->has_storage && !empty($this->storage_options)) {
            $storageOptionsData = array_filter($this->storage_options, function ($option) {
                return !empty(trim($option['storage'])) && !empty(trim($option['price']));
            });
            // Convert prices to numbers
            $storageOptionsData = array_map(function ($option) {
                return [
                    'storage' => trim($option['storage']),
                    'price' => (float) $option['price']
                ];
            }, $storageOptionsData);
        }

        $data = [
            'product_name' => $this->product_name,
            'price' => $this->price,
            'old_price' => $this->old_price,
            'category_id' => $this->category_id,
            'overview' => $this->overview,
            'description' => $this->description,
            'about' => $this->about,
            'reviews' => $this->reviews ? json_decode($this->reviews, true) : [],
            'what_is_included' => $this->what_is_included ? array_filter(explode("\n", $this->what_is_included)) : [],
            'in_stock' => $this->in_stock && !$this->out_of_stock,
            'images_url' => $allImageUrls, // Use combined image URLs
            'colors' => $this->colors ? array_map('trim', explode(',', $this->colors)) : [],
            'specification' => $this->specification ? array_filter(explode("\n", $this->specification)) : [],
            'storage_options' => $storageOptionsData,
            'product_status' => $this->product_status,
        ];

        Deal::create($data);

        session()->flash('message', 'Deal created successfully!');
        return redirect()->route('admin.products');
    }

    public function cancel()
    {
        return redirect()->route('admin.products');
    }

    public function render()
    {
        $categories = Category::all();
        return view('livewire.admin.create-deal', compact('categories'));
    }
}

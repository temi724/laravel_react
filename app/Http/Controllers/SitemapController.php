<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Deal;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class SitemapController extends Controller
{
    public function index()
    {
        $products = Product::where('in_stock', true)->get();
        $deals = Deal::where('in_stock', true)->get();
        $categories = Category::all();

        return response()->view('sitemap.index', [
            'products' => $products,
            'deals' => $deals,
            'categories' => $categories,
        ])->header('Content-Type', 'application/xml');
    }
}

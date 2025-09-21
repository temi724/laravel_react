@extends('layouts.admin')

@section('title', 'Products Management')
@section('page-title', 'Products')
@section('page-description', 'Manage your product inventory and details')

@section('content')
    <div class="p-6">
        {{-- React AdminProductManager Component --}}
        <div
            data-react-component="AdminProductManager"
            @if(isset($mode))
                data-prop-mode="{{ $mode }}"
            @endif
            @if(isset($productId))
                data-prop-productid="{{ $productId }}"
            @endif
        ></div>
    </div>
@endsection

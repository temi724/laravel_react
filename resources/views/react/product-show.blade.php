<x-layout>
    <x-slot name="title">{{ $product->product_name }} - {{ config('app.name') }}</x-slot>

    {{-- React ProductShow Component --}}
    <div
        data-react-component="ProductShow"
        data-prop-productid="{{ $product->id }}"
        data-prop-producttype="{{ $type }}"
    ></div>
</x-layout>

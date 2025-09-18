{{-- React ProductGrid Component --}}
<div
    data-react-component="ProductGrid"
    @if(isset($searchQuery))
    data-prop-initialSearchQuery="{{ $searchQuery }}"
    @endif
    @if(isset($categoryId))
    data-prop-initialCategoryId="{{ $categoryId }}"
    @endif
    {!! $attributes ?? '' !!}
></div>

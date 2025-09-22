{{-- React ProductGrid Component --}}
<div
    data-react-component="ProductGrid"
    data-prop-initialSearchQuery="{{ $searchQuery ?? '' }}"
    @if(isset($categoryId) && $categoryId !== '')
    data-prop-initialCategoryId="{{ $categoryId }}"
    @endif
    {!! $attributes ?? '' !!}
>
    {{-- Debug: Show what data attributes are being set --}}
    <div class="bg-blue-100 p-2 mb-4 text-sm">
        <strong>React Component Debug:</strong><br>
        Search Query Prop: "{{ $searchQuery ?? 'NOT_SET' }}"<br>
        Category ID Prop: "{{ $categoryId ?? 'NOT_SET' }}"<br>
        Search Query isset: {{ isset($searchQuery) ? 'true' : 'false' }}<br>
        Search Query empty: {{ empty($searchQuery) ? 'true' : 'false' }}<br>
        ALWAYS setting data-prop-initialSearchQuery to: "{{ $searchQuery ?? '' }}"<br>
    </div>

    {{-- React Loading Indicator --}}
    <div class="bg-yellow-100 p-4 border border-yellow-400 text-yellow-700">
        <strong>⚠️ If you see this message, React component is NOT working!</strong><br>
        This should be replaced by the React component.
    </div>
</div>

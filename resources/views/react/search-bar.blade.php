{{-- React SearchBar Component --}}
<div
    data-react-component="SearchBar"
    @if(isset($placeholder))
    data-prop-placeholder="{{ $placeholder }}"
    @endif
    {!! $attributes ?? '' !!}
></div>

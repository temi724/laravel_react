@props(['name'])

{{-- Inlines an icon from resources/svg. The files are generated from iconsax-react,
     the same icon family the React components use. --}}
@php
    $file = resource_path('svg/' . basename($name) . '.svg');
    $svg = is_file($file) ? trim(file_get_contents($file)) : '';
    $attrs = $attributes->merge(['class' => 'size-5 shrink-0', 'aria-hidden' => 'true'])->toHtml();
@endphp
{!! $svg !== '' ? preg_replace('/^<svg\b/', '<svg ' . $attrs, $svg, 1) : '' !!}

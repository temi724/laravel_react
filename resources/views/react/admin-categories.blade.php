@extends('layouts.admin')

@section('title', 'Categories')
@section('page-title', 'Categories')
@section('page-description', 'The groups products are listed under on the store')

@section('content')
    <div>
        {{-- React AdminCategories Component --}}
        <div data-react-component="AdminCategories"></div>
    </div>
@endsection

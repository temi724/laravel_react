@extends('layouts.admin')

@section('title', 'Offers')
@section('page-title', 'Offers')
@section('page-description', 'The deal of the day, drops and bundles')

@section('content')
    <div>
        {{-- React AdminOffers Component --}}
        <div data-react-component="AdminOffers"></div>
    </div>
@endsection

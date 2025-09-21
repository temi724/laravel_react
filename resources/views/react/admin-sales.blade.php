@extends('layouts.admin')

@section('title', 'Sales Management')
@section('page-title', 'Sales & Orders')
@section('page-description', 'Track and manage customer orders and sales')

@section('content')
    <div class="p-6">
        {{-- React AdminSalesManager Component --}}
        <div data-react-component="AdminSalesManager"></div>
    </div>
@endsection

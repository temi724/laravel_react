@extends('layouts.admin')

@section('title', 'Order Management')
@section('page-title', 'Order Management')
@section('page-description', 'Process and fulfill customer orders')

@section('content')
    <div class="p-6">
        {{-- React AdminOrderManager Component --}}
        <div data-react-component="AdminOrderManager"></div>
    </div>
@endsection

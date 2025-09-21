@extends('layouts.admin')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard')
@section('page-description', 'Overview of your application performance')

@section('content')
    <div class="p-6">
        {{-- React AdminDashboard Component --}}
        <div data-react-component="AdminDashboard"></div>
    </div>
@endsection

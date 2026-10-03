@extends('layouts.admin')

@section('title', 'No access')
@section('page-title', 'No access')
@section('page-description', 'This page is switched off for your account')

@section('content')
    <div class="panel mx-auto max-w-md p-6 text-center sm:p-10">
        <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <x-icon name="lock" class="size-7" />
        </span>
        <h2 class="mt-5 text-xl font-extrabold tracking-tight">You do not have access to this page</h2>
        <p class="mt-2 text-sm text-gray-600">The super admin decides what each admin can do. Ask them to switch this on for you in Settings.</p>
        <a href="{{ route('admin.dashboard') }}" class="btn btn-primary mt-6">Back to dashboard</a>
    </div>
@endsection

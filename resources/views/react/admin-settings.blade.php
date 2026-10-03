@extends('layouts.admin')

@section('title', 'Settings')
@section('page-title', 'Settings')
@section('page-description', 'Who can sign in to the admin and what each person can do')

@section('content')
    <div>
        {{-- React AdminSettings Component --}}
        <div data-react-component="AdminSettings"></div>
    </div>
@endsection

<?php

use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('can view users page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Admin/Users')
        ->has('users')
        ->has('stats')
    );
});

it('can toggle user status', function () {
    $userToSuspend = User::factory()->create(['role' => 'candidate', 'is_active' => true]);

    $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-status', $userToSuspend));
    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertFalse($userToSuspend->fresh()->is_active);
});

it('prevents admin from suspending themselves', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-status', $this->admin));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $this->assertTrue($this->admin->fresh()->is_active);
});

it('can view reports page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.reports'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Admin/Reports')
        ->has('summary')
        ->has('charts')
    );
});

it('can view calendar page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.calendar'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Admin/Calendar')
    );
});

it('can fetch calendar events for admin', function () {
    $response = $this->actingAs($this->admin)->getJson(route('admin.calendar.events', [
        'start' => now()->startOfMonth()->toDateString(),
        'end' => now()->endOfMonth()->toDateString(),
    ]));

    $response->assertOk();
    $response->assertJsonStructure([
        'events',
        'meta' => ['dates'],
    ]);
});

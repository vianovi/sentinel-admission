<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('public package, session, and result pages use isolated public tables', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPAS Publik', 'code' => 'IPAS-P']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket Publik', 'code' => 'IPAS-P-01', 'status' => 'published',
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Publik', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session, 'name' => 'Peserta Publik', 'school_origin' => 'SD Asal',
        'participant_code' => 'STUDENTCODE00001',
    ]);

    $this->actingAs($admin)->get(route('admin.public-exams.packages.index'))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Packages')
            ->has('packages', 1)->where('packages.0.id', $package)->has('subjects', 1));
    $this->get(route('admin.public-exams.sessions.index'))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Sessions')
            ->has('sessions', 1)->has('packages', 1));
    $this->get(route('admin.public-exams.results.index', ['session' => $session]))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Results')
            ->has('participants.data', 1)->where('participants.data.0.name', 'Peserta Publik')
            ->where('selectedSession', $session));

    expect(DB::table('exam_packages')->count())->toBe(0)
        ->and(DB::table('exam_sessions')->count())->toBe(0)
        ->and(DB::table('exam_attempts')->count())->toBe(0);
});

test('only administrators can read public exam admin pages', function () {
    $staff = User::factory()->create(['role' => 'staff']);
    foreach (['packages.index', 'sessions.index', 'results.index'] as $name) {
        $url = route('admin.public-exams.'.$name);
        $this->get($url)->assertRedirect();
        $this->actingAs($staff)->get($url)->assertForbidden();
        $this->app['auth']->logout();
    }
});

<?php

use App\Models\User;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutMiddleware(ThrottleRequests::class);
});

test('admin pre-registers two children with the same name but distinct codes', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(), 'status' => 'published',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);

    $first = $this->actingAs($admin)->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak Sama', 'school_origin' => 'SD Asal', 'address' => 'Alamat A',
    ]);
    $second = $this->actingAs($admin)->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak Sama', 'school_origin' => 'SD Asal', 'address' => 'Alamat B',
    ]);

    $first->assertCreated();
    $second->assertCreated();
    expect($first->json('participant_code'))->not->toBe($second->json('participant_code'))
        ->and(DB::table('exam_public_participants')->count())->toBe(2)
        ->and(DB::table('exam_public_participants')->where('id', $first->json('id'))->value('started_at'))->toBeNull();
});

test('guest cannot pre-register a public participant', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);

    $this->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak A', 'school_origin' => 'SD Asal',
    ])->assertUnauthorized();
    expect(DB::table('exam_public_participants')->count())->toBe(0);
});

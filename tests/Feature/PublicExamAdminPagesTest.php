<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('public package, session, and result pages use isolated public tables', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPAS Publik', 'code' => 'IPAS-P']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket Publik', 'code' => 'IPAS-P-01', 'status' => 'published',
        'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Publik', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session, 'name' => 'Peserta Publik', 'school_origin' => 'SD Asal',
        'participant_code' => 'STUDENTCODE00001',
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
        'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    DB::table('exam_public_questions')->insert([
        'exam_public_package_id' => $package, 'question_text' => 'Soal untuk review',
        'options' => json_encode(['A' => 'Satu', 'B' => 'Dua']), 'correct_answer' => 'B', 'point' => 1,
    ]);

    $this->actingAs($admin)->get(route('admin.public-exams.packages.index'))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Packages')
            ->has('packages', 1)->where('packages.0.id', $package)->has('subjects', 1));
    $this->get(route('admin.public-exams.sessions.index'))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Sessions')
            ->has('sessions', 1)->has('packages', 1));
    $this->get(route('admin.public-exams.packages.show', $package))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/PackageShow')
            ->where('examPackage.id', $package)->has('questions', 1)
            ->where('questions.0.correct_answer', 'B')->where('sessions.0.id', $session));
    $this->get(route('admin.public-exams.sessions.show', $session))->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Sessions')
            ->where('detailMode', true)->has('sessions', 1)->where('sessions.0.id', $session)
            ->where('sessions.0.packages.0.id', $package)->where('sessions.0.participants_count', 1));
    $this->get(route('admin.public-exams.packages.show', 999999))->assertNotFound();
    $this->get(route('admin.public-exams.sessions.show', 999999))->assertNotFound();
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
    foreach (['packages.index', 'sessions.index', 'monitoring.index', 'results.index', 'packages.show', 'sessions.show'] as $name) {
        $url = route('admin.public-exams.'.$name, str_ends_with($name, '.show') ? 1 : []);
        $this->get($url)->assertRedirect();
        $this->actingAs($staff)->get($url)->assertForbidden();
        $this->app['auth']->logout();
    }
});

test('admin results keep aggregate outcome data without monitoring violations', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Empat Mapel', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'participant_code' => 'STUDENTCODE00002',
        'name' => 'Anak B', 'school_origin' => 'Sekolah B', 'average_score' => 67.25, 'is_passed' => true, 'status' => 'completed',
    ]);
    foreach (['MTK' => [50, 55], 'IPAS' => [69, 65], 'PAIBP' => [70, 65], 'BINDO' => [80, 65]] as $index => $data) {
        [$score, $threshold] = $data;
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $index, 'code' => $index]);
        $package = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => $index.' Paket 1', 'code' => $index.'-1', 'passing_score' => $threshold,
        ]);
        DB::table('exam_public_session_packages')->insert([
            'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
            'exam_public_subject_id' => $subject, 'sort_order' => $index === 'MTK' ? 0 : ($index === 'IPAS' ? 1 : ($index === 'PAIBP' ? 2 : 3)),
        ]);
        DB::table('exam_public_subject_attempts')->insert([
            'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package,
            'exam_public_subject_id' => $subject, 'started_at' => now(), 'expires_at' => now()->addHour(),
            'status' => 'submitted', 'percentage_score' => $score,
        ]);
    }

    $this->actingAs($admin)->get(route('admin.public-exams.results.index', ['session' => $session]))
        ->assertSuccessful()->assertInertia(fn ($page) => $page
        ->where('participants.data.0.is_passed', true)
        ->where('participants.data.0.average_score', 67.25)
        ->missing('participants.data.0.violations')
        ->missing('participants.data.0.subjects'));
});

test('admin monitoring shows active participants and their violation details', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Matematika', 'code' => 'MON-MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket Monitoring', 'code' => 'MON-01', 'status' => 'published',
        'passing_score' => 65, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Monitoring', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'participant_code' => 'MONITOR00001', 'name' => 'Peserta Monitoring',
        'school_origin' => 'Sekolah Monitoring', 'status' => 'in_progress', 'started_at' => now(),
    ]);
    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject,
        'status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour(), 'violations_count' => 2,
        'metadata' => json_encode(['violations_log' => [['type' => 'tab_switch', 'at' => now()->toIso8601String()], ['type' => 'exit_fullscreen', 'at' => now()->toIso8601String()]]]),
    ]);

    $this->actingAs($admin)->get(route('admin.public-exams.monitoring.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Admin/PublicExam/Monitoring')
            ->where('summary.total', 1)
            ->where('summary.active', 1)
            ->where('summary.with_violations', 1)
            ->where('participants.0.id', $participant)
            ->where('participants.0.display_status', 'Aktif')
            ->where('participants.0.violations_count', 2)
            ->where('participants.0.active_attempt.subject_name', 'Matematika'));
});

test('admin can force stop an active public exam participant', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Matematika', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket MTK', 'code' => 'MTK-01',
        'status' => 'published', 'passing_score' => 65, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Hentikan', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    $question = DB::table('exam_public_questions')->insertGetId([
        'exam_public_package_id' => $package, 'question_text' => 'Dua tambah dua?', 'options' => json_encode(['A' => '3', 'B' => '4']),
        'correct_answer' => 'B', 'point' => 1,
    ]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'participant_code' => 'STUDENTCODE00003',
        'name' => 'Peserta Aktif', 'school_origin' => 'Sekolah Aktif', 'session_secret' => hash('sha256', 'participant-active'), 'started_at' => now(),
    ]);
    $attempt = DB::table('exam_public_subject_attempts')->insertGetId([
        'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject,
        'started_at' => now(), 'expires_at' => now()->addHour(), 'question_order' => json_encode([$question]), 'total_questions' => 1,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.public-exams.results.participants.force-stop', $participant))
        ->assertRedirect();

    expect(DB::table('exam_public_subject_attempts')->where('id', $attempt)->value('status'))->toBe('auto_submitted')
        ->and(DB::table('exam_public_participants')->where('id', $participant)->value('status'))->toBe('completed');
});

test('admin can delete a completed public participant history', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Hapus Riwayat', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'participant_code' => 'STUDENTCODE00004',
        'name' => 'Peserta Selesai', 'school_origin' => 'Sekolah Selesai', 'session_secret' => hash('sha256', 'participant-completed'),
        'status' => 'completed', 'started_at' => now(), 'completed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.public-exams.results.participants.destroy', $participant))
        ->assertRedirect();

    $this->assertDatabaseMissing('exam_public_participants', ['id' => $participant]);
    $this->assertDatabaseHas('system_activity_logs', [
        'action' => 'public_exam.participant.history_deleted',
        'target_id' => (string) $participant,
        'actor_id' => $admin->id,
    ]);
});

test('force stop is idempotent when participant status is stale after auto submission', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Bahasa', 'code' => 'MON-BHS']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket Bahasa', 'code' => 'MON-BHS-01', 'status' => 'published',
        'passing_score' => 65, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Status Stale', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'participant_code' => 'STALE00001', 'name' => 'Status Stale',
        'school_origin' => 'Sekolah', 'status' => 'in_progress', 'started_at' => now(),
    ]);
    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject,
        'status' => 'auto_submitted', 'started_at' => now()->subMinutes(5), 'expires_at' => now(),
    ]);

    $this->actingAs($admin)->get(route('admin.public-exams.results.index', ['session' => $session]))
        ->assertInertia(fn ($page) => $page
            ->where('participants.data.0.has_active_attempt', false)
            ->where('participants.data.0.display_status', 'Dihentikan Paksa'));

    $this->actingAs($admin)
        ->post(route('admin.public-exams.results.participants.force-stop', $participant))
        ->assertRedirect();
});

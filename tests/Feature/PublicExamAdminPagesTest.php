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
    foreach (['packages.index', 'sessions.index', 'results.index', 'packages.show', 'sessions.show'] as $name) {
        $url = route('admin.public-exams.'.$name, str_ends_with($name, '.show') ? 1 : []);
        $this->get($url)->assertRedirect();
        $this->actingAs($staff)->get($url)->assertForbidden();
        $this->app['auth']->logout();
    }
});

test('admin result details distinguish a low subject from a passing overall average', function () {
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
        ->where('participants.data.0.subjects.0.name', 'MTK')
        ->where('participants.data.0.subjects.0.best', 50)
        ->where('participants.data.0.subjects.0.passed', false)
        ->where('participants.data.0.subjects.0.threshold', 55)
        ->where('participants.data.0.subjects.0.attempts.0.score', 50)
        ->where('participants.data.0.subjects.0.allow_retry', false)
        ->where('participants.data.0.subjects.1.passed', true));
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

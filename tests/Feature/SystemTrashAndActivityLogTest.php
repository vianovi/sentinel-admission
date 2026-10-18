<?php

use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSubject;
use App\Models\RegistrationDraft;
use App\Models\SystemActivityLog;
use App\Models\SystemTrash;
use App\Models\User;
use App\Services\Trash\TrashManagerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->candidateUser = User::factory()->create(['role' => 'candidate']);
});

it('rejects ZIP uploads while archive support is deferred', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exams.media.store'), [
            'files' => [UploadedFile::fake()->create('bank-media.zip', 10, 'application/zip')],
        ])
        ->assertSessionHasErrors('files.0');

    Storage::disk('public')->assertMissing('exam/images/bank-media.zip');
});

it('moves exam media to trash and cleans question tags from related exam questions', function () {
    $subject = ExamSubject::create(['name' => 'Matematika Dasar', 'code' => 'MTK-01', 'is_active' => true]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'title' => 'Paket Aljabar',
        'code' => 'MTK-PKG-01',
        'duration_minutes' => 60,
    ]);

    $question = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => "Perhatikan ilustrasi berikut:\n[GAMBAR: segitiga-sama-kaki.png]\nHitunglah keliling bangun di atas!",
        'options' => json_encode(['A' => '10 cm', 'B' => '20 cm', 'C' => '30 cm', 'D' => '40 cm', 'E' => '50 cm']),
        'correct_answer' => 'B',
        'point' => 1,
    ]);

    Storage::disk('public')->put('exam/images/segitiga-sama-kaki.png', 'fake image binary content');

    $response = $this->actingAs($this->admin)->delete(route('admin.exams.media.destroy'), [
        'name' => 'segitiga-sama-kaki.png',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    Storage::disk('public')->assertMissing('exam/images/segitiga-sama-kaki.png');
    Storage::disk('public')->assertExists('trash/exam-images/segitiga-sama-kaki.png');

    $cleanedQuestion = $question->fresh();
    expect($cleanedQuestion->question_text)->not->toContain('[GAMBAR: segitiga-sama-kaki.png]');
    expect($cleanedQuestion->question_text)->toContain('Hitunglah keliling bangun di atas!');

    $trash = SystemTrash::where('type', 'exam_media')->where('identifier', 'segitiga-sama-kaki.png')->first();
    expect($trash)->not->toBeNull();
    expect($trash->metadata['affected_questions_count'])->toBe(1);

    $log = SystemActivityLog::where('action', 'media.deleted_to_trash')->latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->description)->toContain('segitiga-sama-kaki.png');
    expect($log->actor_name)->toBe($this->admin->name);

    $this->actingAs($this->admin)
        ->post(route('admin.system.trash.restore', $trash->id))
        ->assertRedirect()
        ->assertSessionHas('success');

    Storage::disk('public')->assertExists('exam/images/segitiga-sama-kaki.png');
    expect($question->fresh()->question_text)->toContain('[GAMBAR: segitiga-sama-kaki.png]');

    $restoreLog = SystemActivityLog::where('action', 'media.restored')->latest('id')->first();
    expect($restoreLog->metadata['restored_question_ids'])->toBe([$question->id]);
});

it('can restore exam media from trash back to bank media', function () {
    Storage::disk('public')->put('trash/exam-images/diagram-lingkaran.png', 'sample image');

    $trash = SystemTrash::create([
        'type' => 'exam_media',
        'name' => 'diagram-lingkaran.png',
        'identifier' => 'diagram-lingkaran.png',
        'original_path' => 'exam/images/diagram-lingkaran.png',
        'trash_path' => 'trash/exam-images/diagram-lingkaran.png',
        'file_size' => 1024,
        'mime_type' => 'image/png',
        'deleted_by' => $this->admin->id,
        'deleted_by_name' => $this->admin->name,
        'purge_at' => now()->addDays(30),
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.system.trash.restore', $trash->id));
    $response->assertRedirect();
    $response->assertSessionHas('success');

    Storage::disk('public')->assertExists('exam/images/diagram-lingkaran.png');
    Storage::disk('public')->assertMissing('trash/exam-images/diagram-lingkaran.png');
    expect(SystemTrash::where('id', $trash->id)->exists())->toBeFalse();

    $log = SystemActivityLog::where('action', 'media.restored')->first();
    expect($log)->not->toBeNull();
    expect($log->description)->toContain('diagram-lingkaran.png');
});

it('can permanently purge exam media from trash', function () {
    Storage::disk('public')->put('trash/exam-images/vektor-lama.png', 'sample image');

    $trash = SystemTrash::create([
        'type' => 'exam_media',
        'name' => 'vektor-lama.png',
        'identifier' => 'vektor-lama.png',
        'original_path' => 'exam/images/vektor-lama.png',
        'trash_path' => 'trash/exam-images/vektor-lama.png',
        'file_size' => 2048,
        'purge_at' => now()->addDays(30),
    ]);

    $response = $this->actingAs($this->admin)->delete(route('admin.system.trash.purge', $trash->id));
    $response->assertRedirect();
    $response->assertSessionHas('success');

    Storage::disk('public')->assertMissing('trash/exam-images/vektor-lama.png');
    expect(SystemTrash::where('id', $trash->id)->exists())->toBeFalse();

    $log = SystemActivityLog::where('action', 'media.purged')->first();
    expect($log)->not->toBeNull();
});

it('can trash, restore, and purge candidate drafts', function () {
    $draft = RegistrationDraft::create([
        'registration_code' => 'REG-TEST-999',
        'secret_token' => 'token-test-secret',
        'full_name' => 'Fauzi Ramadhan',
        'nisn' => '1234567890',
        'nik' => '3201010101010001',
        'email' => 'fauzi@example.test',
        'whatsapp_number' => '081299998888',
        'current_step' => 2,
    ]);

    $trashService = app(TrashManagerService::class);
    $trash = $trashService->trashCandidateDraft($draft->id, $this->admin);

    expect($draft->fresh()->trashed())->toBeTrue();
    expect($trash->type)->toBe('candidate_draft');
    expect($trash->name)->toBe('Fauzi Ramadhan');

    $trashService->restoreCandidateDraft($trash->id, $this->admin);
    expect($draft->fresh()->trashed())->toBeFalse();
    expect(SystemTrash::where('id', $trash->id)->exists())->toBeFalse();

    $trash2 = $trashService->trashCandidateDraft($draft->id, $this->admin);
    $trashService->purgeCandidateDraft($trash2->id, $this->admin);
    expect(RegistrationDraft::withTrashed()->find($draft->id))->toBeNull();
});

it('prunes expired trash items via console command', function () {
    Storage::disk('public')->put('trash/exam-images/expired.png', 'content');
    Storage::disk('public')->put('trash/exam-images/keep.png', 'content');

    $expiredTrash = SystemTrash::create([
        'type' => 'exam_media',
        'name' => 'expired.png',
        'identifier' => 'expired.png',
        'trash_path' => 'trash/exam-images/expired.png',
        'purge_at' => now()->subDay(),
    ]);

    $activeTrash = SystemTrash::create([
        'type' => 'exam_media',
        'name' => 'keep.png',
        'identifier' => 'keep.png',
        'trash_path' => 'trash/exam-images/keep.png',
        'purge_at' => now()->addDays(20),
    ]);

    $this->artisan('system:prune-trash')->assertSuccessful();

    Storage::disk('public')->assertMissing('trash/exam-images/expired.png');
    Storage::disk('public')->assertExists('trash/exam-images/keep.png');

    expect(SystemTrash::where('id', $expiredTrash->id)->exists())->toBeFalse();
    expect(SystemTrash::where('id', $activeTrash->id)->exists())->toBeTrue();
});

it('allows admin to view system activity logs and trash pages, but forbids candidate role', function () {
    $this->actingAs($this->candidateUser)
        ->get(route('admin.system.activity-logs.index'))
        ->assertForbidden();

    $this->actingAs($this->candidateUser)
        ->get(route('admin.system.trash.media'))
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->get(route('admin.system.activity-logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/System/ActivityLogs'));

    $this->actingAs($this->admin)
        ->get(route('admin.system.trash.media'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/System/TrashMedia'));

    $this->actingAs($this->admin)
        ->get(route('admin.system.trash.candidates'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/System/TrashCandidates'));
});

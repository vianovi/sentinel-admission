<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->staff = User::factory()->create(['role' => 'staff']);
    $this->candidate = User::factory()->create(['role' => 'candidate']);
});

it('blocks unauthenticated and non-admin users from public exam media', function () {
    $this->get(route('admin.public-exams.media.index'))->assertRedirect(route('login'));
    $this->actingAs($this->candidate)->get(route('admin.public-exams.media.index'))->assertForbidden();
    $this->actingAs($this->staff)->get(route('admin.public-exams.media.index'))->assertForbidden();
});

it('allows admin to view public exam media manager and lists public packages', function () {
    $subject = DB::table('exam_public_subjects')->insertGetId([
        'name' => 'Matematika Publik',
        'code' => 'MTK-PUB',
    ]);
    $pkgId = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject,
        'title' => 'Paket Logika',
        'code' => 'LOGIKA-01',
        'duration_minutes' => 45,
    ]);
    $qId = DB::table('exam_public_questions')->insertGetId([
        'exam_public_package_id' => $pkgId,
        'question_text' => 'Soal 1 tanpa gambar',
        'options' => json_encode(['A' => '1', 'B' => '2']),
        'correct_answer' => 'A',
        'point' => 10,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)->get(route('admin.public-exams.media.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/MediaManager'));

    $packagesRes = $this->actingAs($this->admin)->getJson(route('admin.public-exams.media.packages'));
    $packagesRes->assertOk()->assertJsonCount(1);

    $questionsRes = $this->actingAs($this->admin)->getJson(route('admin.public-exams.media.questions', $pkgId));
    $questionsRes->assertOk()->assertJsonCount(1)->assertJsonPath('0.has_image', false);
});

it('allows admin to upload images to isolated public exam directory and serve them', function () {
    $file = UploadedFile::fake()->image('diagram-lingkaran.png', 400, 300);

    $response = $this->actingAs($this->admin)->post(route('admin.public-exams.media.store'), [
        'files' => [$file],
    ]);

    $response->assertSessionHas('success');
    Storage::disk('public')->assertExists('exam-public/images/diagram-lingkaran.png');
    Storage::disk('public')->assertMissing('exam/images/diagram-lingkaran.png'); // isolated from internal

    // Accessible via /exam-media/{filename}
    $serveRes = $this->get('/exam-media/diagram-lingkaran.png');
    $serveRes->assertOk();
});

it('rejects non-image uploads such as zip or php', function () {
    $zip = UploadedFile::fake()->create('arsip.zip', 10, 'application/zip');

    $response = $this->actingAs($this->admin)->post(route('admin.public-exams.media.store'), [
        'files' => [$zip],
    ]);

    $response->assertSessionHasErrors('files.0');
    Storage::disk('public')->assertMissing('exam-public/images/arsip.zip');
});

it('allows admin to rename public exam media and updates references in exam_public_questions', function () {
    Storage::disk('public')->put('exam-public/images/grafik-awal.png', 'content');

    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPA', 'code' => 'IPA']);
    $pkgId = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject,
        'title' => 'Paket IPA',
        'code' => 'IPA-01',
        'duration_minutes' => 30,
    ]);
    $qId = DB::table('exam_public_questions')->insertGetId([
        'exam_public_package_id' => $pkgId,
        'question_text' => "Perhatikan gambar berikut:\n[GAMBAR: grafik-awal.png]\nApakah nama grafik di atas?",
        'options' => json_encode(['A' => 'A', 'B' => 'B']),
        'correct_answer' => 'A',
        'point' => 10,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)->put(route('admin.public-exams.media.rename'), [
        'old_name' => 'grafik-awal.png',
        'new_name' => 'grafik-revisi.png',
    ])->assertSessionHas('success');

    Storage::disk('public')->assertMissing('exam-public/images/grafik-awal.png');
    Storage::disk('public')->assertExists('exam-public/images/grafik-revisi.png');

    $updatedText = DB::table('exam_public_questions')->where('id', $qId)->value('question_text');
    expect($updatedText)->toContain('[GAMBAR: grafik-revisi.png]')
        ->and($updatedText)->not->toContain('grafik-awal.png');
});

it('allows admin to assign media to public exam question', function () {
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPS', 'code' => 'IPS']);
    $pkgId = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject,
        'title' => 'Paket IPS',
        'code' => 'IPS-01',
        'duration_minutes' => 30,
    ]);
    $qId = DB::table('exam_public_questions')->insertGetId([
        'exam_public_package_id' => $pkgId,
        'question_text' => 'Peta wilayah Asia Tenggara:',
        'options' => json_encode(['A' => 'A', 'B' => 'B']),
        'correct_answer' => 'A',
        'point' => 10,
        'sort_order' => 1,
    ]);

    $res = $this->actingAs($this->admin)->postJson(route('admin.public-exams.media.assign'), [
        'filename' => 'peta-asean.png',
        'question_id' => $qId,
        'position' => 'append',
    ]);

    $res->assertOk()->assertJsonPath('already_exists', false);

    $updatedText = DB::table('exam_public_questions')->where('id', $qId)->value('question_text');
    expect($updatedText)->toContain('[GAMBAR: peta-asean.png]');

    // Duplicate assign returns already_exists true
    $dupRes = $this->actingAs($this->admin)->postJson(route('admin.public-exams.media.assign'), [
        'filename' => 'peta-asean.png',
        'question_id' => $qId,
        'position' => 'append',
    ]);
    $dupRes->assertOk()->assertJsonPath('already_exists', true);
});

it('allows admin to delete media and cleans tags from public exam questions', function () {
    Storage::disk('public')->put('exam-public/images/peta.png', 'content');

    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Geo', 'code' => 'GEO']);
    $pkgId = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject,
        'title' => 'Paket Geo',
        'code' => 'GEO-01',
        'duration_minutes' => 30,
    ]);
    $qId = DB::table('exam_public_questions')->insertGetId([
        'exam_public_package_id' => $pkgId,
        'question_text' => 'Simak [GAMBAR: peta.png] sebelum menjawab.',
        'options' => json_encode(['A' => 'A', 'B' => 'B']),
        'correct_answer' => 'A',
        'point' => 10,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)->delete(route('admin.public-exams.media.destroy'), [
        'name' => 'peta.png',
    ])->assertSessionHas('success');

    Storage::disk('public')->assertMissing('exam-public/images/peta.png');

    $cleanedText = DB::table('exam_public_questions')->where('id', $qId)->value('question_text');
    expect($cleanedText)->not->toContain('[GAMBAR: peta.png]')
        ->and($cleanedText)->toBe('Simak sebelum menjawab.');
});

it('verifies all internal exam submenus return 404', function () {
    $this->actingAs($this->admin)->get('/dashboard/admin/exams')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/media')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/subjects')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/packages')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/sessions')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/results')->assertNotFound();
    $this->actingAs($this->admin)->get('/dashboard/admin/exams/monitoring')->assertNotFound();
});

it('custom 404 page returns admin to the admin dashboard instead of the blocked exam root', function () {
    $this->actingAs($this->admin)
        ->get('/dashboard/admin/exams')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page
            ->component('Errors/NotFound')
            ->where('backUrl', '/dashboard/admin')
            ->where('comingSoon', false)
        );
});

it('keeps public exam categories isolated while supporting admin category management', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.public-exams.categories.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Admin/PublicExam/Categories')
            ->has('subjects', 0)
        );

    $this->post(route('admin.public-exams.categories.store'), [
        'name' => 'Matematika Publik',
        'code' => 'mtk-pub',
        'is_active' => true,
    ])->assertRedirect();

    $publicSubject = DB::table('exam_public_subjects')->where('code', 'MTK-PUB')->first();
    expect($publicSubject)->not->toBeNull()
        ->and(DB::table('exam_subjects')->where('code', 'MTK-PUB')->exists())->toBeFalse();

    $this->put(route('admin.public-exams.categories.update', $publicSubject->id), [
        'name' => 'Matematika Umum Publik',
        'code' => 'mtk-pub-umum',
        'is_active' => false,
    ])->assertRedirect();

    expect(DB::table('exam_public_subjects')->where('id', $publicSubject->id)->value('name'))->toBe('Matematika Umum Publik')
        ->and(DB::table('exam_public_subjects')->where('id', $publicSubject->id)->value('is_active'))->toBe(0);

    $this->delete(route('admin.public-exams.categories.destroy', $publicSubject->id))->assertRedirect();
    expect(DB::table('exam_public_subjects')->where('id', $publicSubject->id)->exists())->toBeFalse();
});

it('refuses deleting a public category that still has public packages', function () {
    $subjectId = DB::table('exam_public_subjects')->insertGetId([
        'name' => 'IPA Publik',
        'code' => 'IPA-PUB',
    ]);
    DB::table('exam_public_packages')->insert([
        'exam_public_subject_id' => $subjectId,
        'title' => 'Paket IPA Publik',
        'code' => 'IPA-PUB-01',
        'duration_minutes' => 45,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.public-exams.categories.destroy', $subjectId))
        ->assertSessionHasErrors('subject');

    expect(DB::table('exam_public_subjects')->where('id', $subjectId)->exists())->toBeTrue();
});

it('rejects guests and non-admin users from public category management', function () {
    $this->get(route('admin.public-exams.categories.index'))->assertRedirect(route('login'));
    $this->actingAs($this->staff)->get(route('admin.public-exams.categories.index'))->assertForbidden();
    $this->actingAs($this->candidate)->post(route('admin.public-exams.categories.store'), [
        'name' => 'Tidak boleh',
        'code' => 'NOPE',
    ])->assertForbidden();
});

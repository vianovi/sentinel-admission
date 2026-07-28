<?php

use App\Models\RegistrationDraft;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function registrationDraft(array $overrides = []): RegistrationDraft
{
    return RegistrationDraft::create(array_merge([
        'secret_token' => str_repeat('a', 64),
        'expires_at' => now()->addDays(2),
        'current_step' => 1,
        'nisn' => '1234567890',
        'nik' => '1234567890123456',
        'full_name' => 'Pemilik Draft',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
    ], $overrides));
}

it('creates ownership token and two day expiry at step one', function () {
    $before = now()->addDays(2)->subSecond();

    $response = $this->postJson('/daftar/step1', [
        'full_name' => 'Pemilik Draft',
        'nisn' => '1234567890',
        'nik' => '1234567890123456',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
    ]);

    $response->assertOk()->assertCookie('draft_token');

    $draft = RegistrationDraft::findOrFail($response->json('draft_id'));

    expect($draft->secret_token)->toBeString()->toHaveLength(64)
        ->and($draft->expires_at->betweenIncluded($before, now()->addDays(2)->addSecond()))->toBeTrue();
});

it('does not trust a known draft id without its ownership token', function () {
    $draft = registrationDraft();

    $this->postJson('/daftar/check-draft', ['draft_id' => $draft->id])
        ->assertOk()
        ->assertJson(['valid' => false]);

    $this->postJson('/daftar/step1', [
        'draft_id' => $draft->id,
        'full_name' => 'Pengambil Alih',
        'nisn' => $draft->nisn,
        'nik' => $draft->nik,
        'gender' => 'P',
        'place_of_birth' => 'Jakarta',
        'date_of_birth' => '2010-01-01',
    ])->assertForbidden();

    $this->putJson("/daftar/step2/{$draft->id}", [
        'mother_name' => 'Ibu',
        'whatsapp_number' => '081234567890',
        'email' => 'draft@gmail.com',
        'addr_jalan' => 'Jalan Aman',
        'addr_rt' => '001',
        'addr_rw' => '002',
        'addr_desa' => 'Desa',
        'addr_kec' => 'Kecamatan',
        'addr_kab' => 'Kabupaten',
        'addr_prov' => 'Provinsi',
    ])->assertForbidden();

    $this->putJson("/daftar/step3/init/{$draft->id}")->assertForbidden();
    $this->putJson("/daftar/step3/{$draft->id}", [
        'school_origin' => 'Sekolah',
        'agreement' => '1',
    ])->assertForbidden();

    expect($draft->fresh()->full_name)->toBe('Pemilik Draft')
        ->and($draft->fresh()->registration_code)->toBeNull()
        ->and($draft->fresh()->school_origin)->toBeNull();
});

it('allows the owning browser to continue every draft step', function () {
    $draft = registrationDraft();

    $this->withCredentials()
        ->withCookie('draft_token', $draft->secret_token)
        ->postJson('/daftar/check-draft', ['draft_id' => $draft->id])
        ->assertOk()
        ->assertJson(['valid' => true]);

    $this->putJson("/daftar/step2/{$draft->id}", [
        'mother_name' => 'Ibu',
        'whatsapp_number' => '081234567890',
        'email' => 'owner@gmail.com',
        'addr_jalan' => 'Jalan Aman',
        'addr_rt' => '001',
        'addr_rw' => '002',
        'addr_desa' => 'Desa',
        'addr_kec' => 'Kecamatan',
        'addr_kab' => 'Kabupaten',
        'addr_prov' => 'Provinsi',
    ])->assertOk();

    $this
        ->putJson("/daftar/step3/init/{$draft->id}")
        ->assertOk()
        ->assertJsonStructure(['registration_code']);

    $this->putJson("/daftar/step3/{$draft->id}", [
        'school_origin' => 'Sekolah Asal',
        'agreement' => '1',
    ])->assertOk();

    expect($draft->fresh()->secret_token)->toBe(str_repeat('a', 64))
        ->and($draft->fresh()->school_origin)->toBe('Sekolah Asal');
});

it('rejects a registration email whose domain cannot receive mail', function () {
    config(['email.validation.check_mx' => true]);

    $draft = registrationDraft();

    $this->withCredentials()
        ->withCookie('draft_token', $draft->secret_token)
        ->putJson("/daftar/step2/{$draft->id}", [
            'mother_name' => 'Ibu',
            'whatsapp_number' => '081234567890',
            'email' => 'candidate@domain-tidak-ada.invalid',
            'addr_jalan' => 'Jalan Aman',
            'addr_rt' => '001',
            'addr_rw' => '002',
            'addr_desa' => 'Desa',
            'addr_kec' => 'Kecamatan',
            'addr_kab' => 'Kabupaten',
            'addr_prov' => 'Provinsi',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');

    expect($draft->fresh()->email)->toBeNull();
});

it('does not expose or resume draft pii without the original browser token', function () {
    $draft = registrationDraft(['full_name' => 'Nama Sangat Rahasia']);

    $duplicate = $this->postJson('/daftar/check-duplicate', [
        'nisn' => $draft->nisn,
        'nik' => $draft->nik,
    ]);

    $duplicate->assertOk()
        ->assertJsonPath('can_resume', false)
        ->assertJsonMissing(['draft_id' => $draft->id]);

    expect($duplicate->getContent())->not->toContain('Nama Sangat Rahasia');

    $this->postJson('/daftar/resume', [
        'nisn' => $draft->nisn,
        'nik' => $draft->nik,
    ])->assertForbidden()
        ->assertJsonMissing(['full_name' => 'Nama Sangat Rahasia']);

    $this->withCredentials()
        ->withCookie('draft_token', $draft->secret_token)
        ->postJson('/daftar/resume', [
            'nisn' => $draft->nisn,
            'nik' => $draft->nik,
        ])->assertOk()
        ->assertJsonPath('step1.full_name', 'Nama Sangat Rahasia');
});

it('requires a valid draft token to open registration', function () {
    $draft = registrationDraft([
        'current_step' => 3,
        'mother_name' => 'Ibu',
        'whatsapp_number' => '081234567890',
        'email' => 'draft@gmail.com',
        'school_origin' => 'Sekolah',
        'registration_code' => 'REG-TEST-26-G1',
    ]);

    $this->get('/register')->assertRedirect('/daftar');

    $this->withCookie('draft_token', $draft->secret_token)
        ->get('/register')
        ->assertOk();
});

it('rejects and soft deletes an expired draft when it is accessed', function () {
    $draft = registrationDraft([
        'expires_at' => now()->subSecond(),
    ]);

    $this->withCookie('draft_token', $draft->secret_token)
        ->get('/register')
        ->assertRedirect('/daftar');

    expect(RegistrationDraft::withTrashed()->findOrFail($draft->id)->trashed())->toBeTrue();
});

it('soft deletes expired drafts and force deletes drafts trashed over thirty days', function () {
    $expired = registrationDraft([
        'secret_token' => str_repeat('b', 64),
        'expires_at' => now()->subMinute(),
        'nisn' => '1234567891',
        'nik' => '1234567890123457',
    ]);
    $recentlyTrashed = registrationDraft([
        'secret_token' => str_repeat('c', 64),
        'nisn' => '1234567892',
        'nik' => '1234567890123458',
    ]);
    $oldTrashed = registrationDraft([
        'secret_token' => str_repeat('d', 64),
        'nisn' => '1234567893',
        'nik' => '1234567890123459',
    ]);

    $recentlyTrashed->delete();
    $oldTrashed->delete();
    RegistrationDraft::withTrashed()->whereKey($oldTrashed->id)
        ->update(['deleted_at' => now()->subDays(31)]);

    $this->artisan('drafts:prune')->assertSuccessful();

    expect(RegistrationDraft::withTrashed()->find($expired->id)?->trashed())->toBeTrue()
        ->and(RegistrationDraft::withTrashed()->find($recentlyTrashed->id))->not->toBeNull()
        ->and(RegistrationDraft::withTrashed()->find($oldTrashed->id))->toBeNull();
});

<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionProgram;
use App\Models\AdmissionWave;
use App\Models\Extracurricular;
use App\Models\PaymentConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingsController extends Controller
{
    public function index(): Response
    {
        return $this->render('extracurriculars');
    }

    public function programs(): Response
    {
        return $this->render('programs');
    }

    public function storeProgram(Request $request): RedirectResponse
    {
        AdmissionProgram::create($this->validateProgram($request));

        return back()->with('success', 'Program/Jalur berhasil ditambahkan.');
    }

    public function updateProgram(Request $request, AdmissionProgram $program): RedirectResponse
    {
        $program->update($this->validateProgram($request, $program));

        return back()->with('success', 'Program/Jalur berhasil diperbarui.');
    }

    public function destroyProgram(AdmissionProgram $program): RedirectResponse
    {
        if ($program->filledCount() > 0) {
            return back()->with('error', 'Program/Jalur yang sudah dipilih kandidat tidak bisa dihapus. Nonaktifkan saja jika tidak dipakai.');
        }

        $program->delete();

        return back()->with('success', 'Program/Jalur berhasil dihapus.');
    }

    public function toggleProgram(AdmissionProgram $program): RedirectResponse
    {
        $program->update(['is_active' => ! $program->is_active]);

        return back()->with('success', $program->fresh()->is_active
            ? 'Program/Jalur berhasil diaktifkan.'
            : 'Program/Jalur berhasil dinonaktifkan.');
    }

    public function storeExtracurricular(Request $request): RedirectResponse
    {
        Extracurricular::create($this->validateExtracurricular($request));

        return back()->with('success', 'Ekstrakurikuler berhasil ditambahkan.');
    }

    public function updateExtracurricular(Request $request, Extracurricular $extracurricular): RedirectResponse
    {
        $extracurricular->update($this->validateExtracurricular($request, $extracurricular));

        return back()->with('success', 'Ekstrakurikuler berhasil diperbarui.');
    }

    public function destroyExtracurricular(Extracurricular $extracurricular): RedirectResponse
    {
        $extracurricular->delete();

        return back()->with('success', 'Ekstrakurikuler berhasil dihapus.');
    }

    public function toggleExtracurricular(Extracurricular $extracurricular): RedirectResponse
    {
        $extracurricular->update(['is_active' => ! $extracurricular->is_active]);

        return back()->with('success', $extracurricular->fresh()->is_active
            ? 'Ekstrakurikuler berhasil diaktifkan.'
            : 'Ekstrakurikuler berhasil dinonaktifkan.');
    }

    public function storePaymentConfig(Request $request): RedirectResponse
    {
        $validated = $this->validatePaymentConfig($request);
        $validated['created_by'] = Auth::id();
        $validated['updated_by'] = Auth::id();

        if ($validated['is_active']) {
            $this->deactivatePaymentConfigsForScope($validated['admission_wave_id'] ?? null);
        }

        PaymentConfig::create($validated);

        return back()->with('success', 'Konfigurasi pembayaran berhasil dibuat.');
    }

    public function updatePaymentConfig(Request $request, PaymentConfig $paymentConfig): RedirectResponse
    {
        $validated = $this->validatePaymentConfig($request);
        $validated['updated_by'] = Auth::id();

        if ($validated['is_active']) {
            $this->deactivatePaymentConfigsForScope($validated['admission_wave_id'] ?? null, $paymentConfig->id);
        }

        $paymentConfig->update($validated);

        return back()->with('success', 'Konfigurasi pembayaran berhasil diperbarui.');
    }

    public function destroyPaymentConfig(PaymentConfig $paymentConfig): RedirectResponse
    {
        $paymentConfig->delete();

        return back()->with('success', 'Konfigurasi pembayaran berhasil dihapus.');
    }

    private function render(string $initialTab): Response
    {
        $waves = AdmissionWave::query()
            ->orderByDesc('is_active')
            ->latest()
            ->get(['id', 'title', 'academic_year', 'is_active'])
            ->map(fn (AdmissionWave $wave) => [
                'id' => $wave->id,
                'title' => $wave->title,
                'academic_year' => $wave->academic_year,
                'is_active' => $wave->is_active,
            ]);

        $programs = AdmissionProgram::query()
            ->with('admissionWave:id,title,academic_year,is_active')
            ->orderBy('admission_wave_id')
            ->ordered()
            ->get()
            ->map(fn (AdmissionProgram $program) => [
                'id' => $program->id,
                'admission_wave_id' => $program->admission_wave_id,
                'wave_title' => $program->admissionWave?->title,
                'wave_academic_year' => $program->admissionWave?->academic_year,
                'name' => $program->name,
                'priority' => $program->priority,
                'quota_ideal' => $program->quota_ideal,
                'quota_max' => $program->quota_max,
                'is_open_quota' => $program->is_open_quota,
                'description' => $program->description,
                'is_active' => $program->is_active,
                'filled_count' => $program->filledCount(),
                'quota_zone' => $program->quotaZone(),
            ]);

        $extracurriculars = Extracurricular::query()
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active', 'updated_at'])
            ->map(fn (Extracurricular $extracurricular) => [
                'id' => $extracurricular->id,
                'name' => $extracurricular->name,
                'is_active' => $extracurricular->is_active,
                'updated_at' => $extracurricular->updated_at?->format('d M Y H:i'),
            ]);

        $paymentConfigs = PaymentConfig::query()
            ->with('admissionWave:id,title,academic_year')
            ->latest()
            ->get()
            ->map(fn (PaymentConfig $config) => [
                'id' => $config->id,
                'admission_wave_id' => $config->admission_wave_id,
                'scope_label' => $config->admissionWave
                    ? "{$config->admissionWave->title} {$config->admissionWave->academic_year}"
                    : 'Global Default',
                'gateway_fee_type' => $config->gateway_fee_type,
                'gateway_fee_value' => (float) $config->gateway_fee_value,
                'gateway_fee_label' => $config->gateway_fee_label,
                'bank_name' => $config->bank_name,
                'bank_account_number' => $config->bank_account_number,
                'bank_account_name' => $config->bank_account_name,
                'bank_logo_key' => $config->bank_logo_key,
                'whatsapp_contact' => $config->whatsapp_contact,
                'whatsapp_contact_label' => $config->whatsapp_contact_label,
                'is_active' => $config->is_active,
            ]);

        return Inertia::render('Dashboard/Admin/SystemSettings', [
            'initial_tab' => $initialTab,
            'waves' => $waves,
            'programs' => $programs,
            'extracurriculars' => $extracurriculars,
            'payment_configs' => $paymentConfigs,
            'bank_logos' => PaymentConfig::BANK_LOGOS,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateProgram(Request $request, ?AdmissionProgram $program = null): array
    {
        $waveId = $request->integer('admission_wave_id');

        return $request->validate([
            'admission_wave_id' => ['required', 'integer', 'exists:admission_waves,id'],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('admission_programs')
                    ->where('admission_wave_id', $waveId)
                    ->ignore($program),
            ],
            'priority' => ['required', 'integer', 'min:1', 'max:255'],
            'quota_ideal' => ['required', 'integer', 'min:0', 'max:100000'],
            'quota_max' => ['required', 'integer', 'min:0', 'max:100000', 'gte:quota_ideal'],
            'is_open_quota' => ['boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateExtracurricular(Request $request, ?Extracurricular $extracurricular = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('extracurriculars')->ignore($extracurricular),
            ],
            'is_active' => ['boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePaymentConfig(Request $request): array
    {
        return $request->validate([
            'admission_wave_id' => ['nullable', 'integer', 'exists:admission_waves,id'],
            'gateway_fee_type' => ['required', Rule::in([PaymentConfig::FEE_TYPE_PERCENTAGE, PaymentConfig::FEE_TYPE_FLAT])],
            'gateway_fee_value' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'gateway_fee_label' => ['required', 'string', 'max:100'],
            'bank_name' => ['nullable', 'string', 'max:50'],
            'bank_account_number' => ['nullable', 'string', 'max:30'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
            'bank_logo_key' => ['nullable', Rule::in(array_keys(PaymentConfig::BANK_LOGOS))],
            'whatsapp_contact' => ['nullable', 'regex:/^62[0-9]{8,16}$/'],
            'whatsapp_contact_label' => ['nullable', 'string', 'max:80'],
            'is_active' => ['boolean'],
        ]);
    }

    private function deactivatePaymentConfigsForScope(?int $waveId, ?int $exceptId = null): void
    {
        PaymentConfig::query()
            ->when($waveId, fn ($query) => $query->where('admission_wave_id', $waveId), fn ($query) => $query->whereNull('admission_wave_id'))
            ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
            ->update(['is_active' => false]);
    }
}

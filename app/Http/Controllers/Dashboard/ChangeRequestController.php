<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Services\ChangeRequestService;
use App\Services\StaffCandidate\StaffCandidateOperationalService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ChangeRequestController extends Controller
{
    public function __construct(
        private readonly ChangeRequestService $changeRequestService,
        private readonly StaffCandidateOperationalService $staffCandidates
    ) {}

    public function index(Request $request): Response
    {
        $scope = $this->resolveScope($request);
        $bucket = $this->resolveBucket($request);

        return Inertia::render('Dashboard/Operations/ChangeRequests', [
            'scope' => $scope,
            'data_requests' => $this->changeRequestService->getPendingDataRequests(),
            'email_requests' => $this->changeRequestService->getPendingEmailRequests(),
            'operational_queue' => $this->staffCandidates->actionQueue($scope, $bucket),
            'filters' => [
                'bucket' => $bucket,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    public function approveData(Request $request, Candidate $candidate): RedirectResponse
    {
        return $this->handleAction(
            $request,
            fn () => $this->changeRequestService->approveDataRequest($candidate, $request->user()),
            'Permintaan perubahan data berhasil disetujui.'
        );
    }

    public function rejectData(Request $request, Candidate $candidate): RedirectResponse
    {
        return $this->handleAction(
            $request,
            fn () => $this->changeRequestService->rejectDataRequest(
                $candidate,
                $request->user(),
                (string) $request->input('reason', '')
            ),
            'Permintaan perubahan data berhasil ditolak.'
        );
    }

    public function approveEmail(Request $request, Candidate $candidate): RedirectResponse
    {
        return $this->handleAction(
            $request,
            fn () => $this->changeRequestService->approveEmailRequest($candidate, $request->user()),
            'Permintaan perubahan email disetujui dan diverifikasi manual. Kandidat dapat menerapkan email baru dari profil.'
        );
    }

    public function rejectEmail(Request $request, Candidate $candidate): RedirectResponse
    {
        return $this->handleAction(
            $request,
            fn () => $this->changeRequestService->rejectEmailRequest(
                $candidate,
                $request->user(),
                (string) $request->input('reason', '')
            ),
            'Permintaan perubahan email berhasil ditolak.'
        );
    }

    private function handleAction(Request $request, callable $callback, string $successMessage): RedirectResponse
    {
        try {
            $callback();

            return redirect()
                ->route($this->resolveRouteName($request))
                ->with('success', $successMessage);
        } catch (ValidationException $e) {
            return back()->with('error', $e->errors()[array_key_first($e->errors())][0] ?? 'Validasi gagal.');
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('Change request workflow failed.', [
                'route' => $request->route()?->getName(),
                'user_id' => $request->user()?->id,
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', 'Terjadi kesalahan saat memproses permintaan.');
        }
    }

    private function resolveScope(Request $request): string
    {
        return str_starts_with((string) $request->route()?->getName(), 'admin.')
            ? 'admin'
            : 'staff';
    }

    private function resolveRouteName(Request $request): string
    {
        return $this->resolveScope($request) . '.change-requests.index';
    }

    private function resolveBucket(Request $request): ?string
    {
        $bucket = trim((string) $request->input('bucket', ''));

        return array_key_exists($bucket, StaffCandidateOperationalService::ACTION_FILTERS)
            ? $bucket
            : null;
    }
}

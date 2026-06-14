<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;
use App\Services\SecureFileAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SecureFileController extends Controller
{
    public function __construct(
        private readonly SecureFileAccessService $files
    ) {}

    public function candidateDocumentPreview(Request $request, CandidateDocument $document)
    {
        return $this->serve(fn () => $this->files->candidateDocument($request, $document, 'preview'), 'preview');
    }

    public function candidateDocumentDownload(Request $request, CandidateDocument $document)
    {
        return $this->serve(fn () => $this->files->candidateDocument($request, $document, 'download'), 'download');
    }

    public function candidateHealthDocumentPreview(Request $request, string $docType)
    {
        return $this->serve(fn () => $this->files->candidateHealthDocument($request, $docType, 'preview'), 'preview');
    }

    public function candidatePaymentProofPreview(Request $request, Payment $payment)
    {
        return $this->serve(fn () => $this->files->candidatePaymentProof($request, $payment, 'preview'), 'preview');
    }

    public function staffDocumentPreview(Request $request, CandidateDocument $document)
    {
        return $this->serve(fn () => $this->files->staffDocument($request, $document, 'preview'), 'preview');
    }

    public function staffHealthDocumentPreview(Request $request, Candidate $candidate, string $docType)
    {
        return $this->serve(fn () => $this->files->staffHealthDocument($request, $candidate, $docType, 'preview'), 'preview');
    }

    public function staffPaymentProofPreview(Request $request, Payment $payment)
    {
        return $this->serve(fn () => $this->files->staffPaymentProof($request, $payment, 'preview'), 'preview');
    }

    public function adminDocumentPreview(Request $request, CandidateDocument $document)
    {
        return $this->serve(fn () => $this->files->adminDocument($request, $document, 'preview'), 'preview');
    }

    public function adminHealthDocumentPreview(Request $request, Candidate $candidate, string $docType)
    {
        return $this->serve(fn () => $this->files->adminHealthDocument($request, $candidate, $docType, 'preview'), 'preview');
    }

    public function adminPaymentProofPreview(Request $request, Payment $payment)
    {
        return $this->serve(fn () => $this->files->adminPaymentProof($request, $payment, 'preview'), 'preview');
    }

    private function serve(callable $resolver, string $action)
    {
        try {
            return $this->files->response($resolver(), $action);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Secure file access failed', [
                'user_id' => request()->user()?->id,
                'role' => request()->user()?->role,
                'action' => $action,
                'exception' => get_class($e),
            ]);

            abort(404);
        }
    }
}

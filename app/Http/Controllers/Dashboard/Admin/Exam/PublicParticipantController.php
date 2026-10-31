<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicParticipantController extends Controller
{
    public function index(int $session): JsonResponse
    {
        abort_unless(DB::table('exam_public_sessions')->where('id', $session)->exists(), 404);

        return response()->json(DB::table('exam_public_participants')
            ->where('exam_public_session_id', $session)
            ->orderBy('id')
            ->paginate(50, ['id', 'participant_code', 'name', 'school_origin', 'address', 'started_at', 'status', 'average_score', 'is_passed']));
    }

    public function store(Request $request, int $session): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'school_origin' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        abort_unless(DB::table('exam_public_sessions')->where('id', $session)->exists(), 404);

        $code = Str::upper(Str::random(16));
        $id = DB::table('exam_public_participants')->insertGetId([
            'exam_public_session_id' => $session,
            'participant_code' => $code,
            ...$data,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'participant_code' => $code], 201);
    }

    public function export(int $session): StreamedResponse
    {
        abort_unless(DB::table('exam_public_sessions')->where('id', $session)->exists(), 404);

        $subjects = DB::table('exam_public_session_packages as pivot')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'pivot.exam_public_subject_id')
            ->where('pivot.exam_public_session_id', $session)->orderBy('pivot.sort_order')
            ->get(['subject.id', 'subject.name']);

        return response()->streamDownload(function () use ($session, $subjects): void {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, [
                'Kode Peserta', 'Nama', 'Asal Sekolah', 'Alamat',
                ...$subjects->flatMap(fn ($subject) => [
                    $this->safeCsv($subject->name.' Awal'),
                    $this->safeCsv($subject->name.' Remedial'),
                    $this->safeCsv($subject->name.' Efektif'),
                ])->all(),
                'Rata-rata', 'Kelulusan',
            ]);

            DB::table('exam_public_participants')->where('exam_public_session_id', $session)
                ->orderBy('id')->chunkById(100, function ($participants) use ($stream, $subjects): void {
                    $attempts = DB::table('exam_public_subject_attempts')
                        ->whereIn('exam_public_participant_id', $participants->pluck('id'))
                        ->whereIn('status', ['submitted', 'auto_submitted'])
                        ->get(['exam_public_participant_id', 'exam_public_subject_id', 'attempt_type', 'percentage_score'])
                        ->groupBy('exam_public_participant_id');

                    foreach ($participants as $participant) {
                        $scores = $attempts->get($participant->id, collect())->groupBy('exam_public_subject_id');
                        $columns = [];
                        foreach ($subjects as $subject) {
                            $subjectAttempts = $scores->get($subject->id, collect());
                            $primary = $subjectAttempts->firstWhere('attempt_type', 'primary')?->percentage_score;
                            $remedial = $subjectAttempts->where('attempt_type', 'remedial')->max('percentage_score');
                            array_push($columns, $primary, $remedial, $primary === null ? null : max((float) $primary, (float) ($remedial ?? $primary)));
                        }

                        fputcsv($stream, [
                            $this->safeCsv($participant->participant_code),
                            $this->safeCsv($participant->name),
                            $this->safeCsv($participant->school_origin),
                            $this->safeCsv($participant->address),
                            ...$columns,
                            $participant->average_score,
                            $participant->is_passed === null ? 'BELUM SELESAI' : ($participant->is_passed ? 'LULUS' : 'TIDAK LULUS'),
                        ]);
                    }
                });
            fclose($stream);
        }, 'hasil-ujian-publik-'.$session.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function safeCsv(?string $value): string
    {
        return preg_match('/^\s*[=+\-@\t\r\n]/u', $value ?? '') ? "'".$value : ($value ?? '');
    }
}

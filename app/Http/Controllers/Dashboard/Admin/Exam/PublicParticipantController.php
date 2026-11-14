<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        abort(410, 'Peserta mengisi identitas sendiri melalui portal ujian publik.');
    }

    public function export(int $session): StreamedResponse
    {
        abort_unless(DB::table('exam_public_sessions')->where('id', $session)->exists(), 404);

        $subjects = DB::table('exam_public_session_packages as pivot')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'pivot.exam_public_subject_id')
            ->where('pivot.exam_public_session_id', $session)->orderBy('pivot.sort_order')
            ->join('exam_public_packages as package', 'package.id', '=', 'pivot.exam_public_package_id')
            ->get(['subject.id', 'subject.name', 'package.passing_score']);

        return response()->streamDownload(function () use ($session, $subjects): void {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, [
                'Kode Peserta', 'Nama', 'Asal Sekolah', 'Alamat',
                ...$subjects->flatMap(fn ($subject) => [
                    $this->safeCsv($subject->name.' Awal'),
                    $this->safeCsv($subject->name.' Remedial'),
                    $this->safeCsv($subject->name.' Efektif'),
                    $this->safeCsv($subject->name.' Ambang'),
                    $this->safeCsv($subject->name.' Status'),
                ])->all(),
                'Rata-rata', 'Kelulusan', 'Catatan',
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
                        $notes = [];
                        foreach ($subjects as $subject) {
                            $subjectAttempts = $scores->get($subject->id, collect());
                            $primary = $subjectAttempts->firstWhere('attempt_type', 'primary')?->percentage_score;
                            $remedial = $subjectAttempts->where('attempt_type', 'remedial')->max('percentage_score');
                            $best = $primary === null ? null : max((float) $primary, (float) ($remedial ?? $primary));
                            $below = $best !== null && $subject->passing_score !== null && $best <= (float) $subject->passing_score;
                            if ($below) {
                                $notes[] = $subject->name.' di bawah ambang mapel; '.($participant->is_passed ? 'rata-rata akhir lulus' : 'rata-rata akhir belum lulus');
                            }
                            array_push($columns, $primary, $remedial, $best, $subject->passing_score, $best === null || $subject->passing_score === null ? 'BELUM ADA NILAI' : ($below ? 'TIDAK LULUS MAPEL' : 'LULUS MAPEL'));
                        }

                        fputcsv($stream, [
                            $this->safeCsv($participant->participant_code),
                            $this->safeCsv($participant->name),
                            $this->safeCsv($participant->school_origin),
                            $this->safeCsv($participant->address),
                            ...$columns,
                            $participant->average_score,
                            $participant->is_passed === null ? 'BELUM SELESAI' : ($participant->is_passed ? 'LULUS' : 'TIDAK LULUS'),
                            $this->safeCsv(implode('; ', $notes)),
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

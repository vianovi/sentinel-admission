<?php

namespace App\Http\Controllers\Dashboard\Admin\PublicExam;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PublicExamCategoryController extends Controller
{
    public function index(): Response
    {
        $subjects = DB::table('exam_public_subjects as subject')
            ->select(['subject.id', 'subject.name', 'subject.code', 'subject.is_active', 'subject.created_at'])
            ->selectSub(
                DB::table('exam_public_packages')
                    ->selectRaw('count(*)')
                    ->whereColumn('exam_public_subject_id', 'subject.id'),
                'packages_count'
            )
            ->selectSub(
                DB::table('exam_public_questions as question')
                    ->join('exam_public_packages as package', 'package.id', '=', 'question.exam_public_package_id')
                    ->whereColumn('package.exam_public_subject_id', 'subject.id')
                    ->whereNull('question.deleted_at')
                    ->where('question.is_active', true)
                    ->selectRaw('count(*)'),
                'questions_count'
            )
            ->orderByDesc('subject.id')
            ->get()
            ->map(fn (object $subject): array => [
                'id' => (int) $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'is_active' => (bool) $subject->is_active,
                'packages_count' => (int) $subject->packages_count,
                'questions_count' => (int) $subject->questions_count,
                'created_at' => $subject->created_at
                    ? \Illuminate\Support\Carbon::parse($subject->created_at)->format('d M Y')
                    : null,
            ]);

        return Inertia::render('Dashboard/Admin/PublicExam/Categories', [
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'alpha_dash', 'max:50', Rule::unique('exam_public_subjects', 'code')],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        DB::table('exam_public_subjects')->insert([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'is_active' => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Kategori ujian publik berhasil dibuat.');
    }

    public function update(Request $request, int $subject): RedirectResponse
    {
        abort_unless(DB::table('exam_public_subjects')->where('id', $subject)->exists(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'alpha_dash', 'max:50', Rule::unique('exam_public_subjects', 'code')->ignore($subject)],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::table('exam_public_subjects')->where('id', $subject)->update([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'is_active' => $data['is_active'],
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Kategori ujian publik berhasil diperbarui.');
    }

    public function destroy(int $subject): RedirectResponse
    {
        $exists = DB::table('exam_public_subjects')->where('id', $subject)->exists();
        abort_unless($exists, 404);

        if (DB::table('exam_public_packages')->where('exam_public_subject_id', $subject)->exists()) {
            return back()->withErrors([
                'subject' => 'Kategori tidak bisa dihapus karena masih memiliki paket ujian publik.',
            ]);
        }

        DB::table('exam_public_subjects')->where('id', $subject)->delete();

        return back()->with('success', 'Kategori ujian publik berhasil dihapus.');
    }
}

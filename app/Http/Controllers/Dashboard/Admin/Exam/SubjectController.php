<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamSubjectRequest;
use App\Models\Exam\ExamSubject;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Subjects', [
            'subjects' => ExamSubject::withCount(['packages', 'questions'])
                ->latest()
                ->get()
                ->map(fn (ExamSubject $subject) => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'description' => $subject->description,
                    'is_active' => $subject->is_active,
                    'packages_count' => $subject->packages_count,
                    'questions_count' => $subject->questions_count,
                    'created_at' => $subject->created_at?->format('d M Y'),
                ]),
        ]);
    }

    public function store(StoreExamSubjectRequest $request): RedirectResponse
    {
        ExamSubject::create($request->validated());

        return back()->with('success', 'Kategori ujian berhasil dibuat.');
    }

    public function update(StoreExamSubjectRequest $request, ExamSubject $subject): RedirectResponse
    {
        $subject->update($request->validated());

        return back()->with('success', 'Kategori ujian berhasil diperbarui.');
    }

    public function destroy(ExamSubject $subject): RedirectResponse
    {
        if ($subject->packages()->exists() || $subject->questions()->exists()) {
            return back()->withErrors([
                'subject' => 'Kategori tidak bisa dihapus karena masih memiliki paket atau soal.',
            ]);
        }

        $subject->delete();

        return back()->with('success', 'Kategori ujian berhasil dihapus.');
    }
}

<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        $packageId = $this->route('package')?->id;

        return [
            'exam_subject_id' => ['required', 'integer', 'exists:exam_subjects,id'],
            'title' => ['required', 'string', 'max:160'],
            'code' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('exam_packages', 'code')->ignore($packageId),
            ],
            'description' => ['nullable', 'string', 'max:1500'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:300'],
            'passing_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:5'],
            'randomize_questions' => ['sometimes', 'boolean'],
            'randomize_options' => ['sometimes', 'boolean'],
            'show_result_to_candidate' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'closed', 'archived'])],
        ];
    }
}

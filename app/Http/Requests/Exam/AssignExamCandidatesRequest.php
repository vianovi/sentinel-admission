<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class AssignExamCandidatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'candidate_ids' => ['required', 'array', 'min:1', 'max:500'],
            'candidate_ids.*' => ['integer', 'exists:candidates,id'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}

<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicParticipantController extends Controller
{
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
}

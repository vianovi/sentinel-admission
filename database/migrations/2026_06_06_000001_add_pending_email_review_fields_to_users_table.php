<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pending_email_status', 20)->nullable()->after('pending_email_token');
            $table->foreignId('pending_email_reviewed_by')
                ->nullable()
                ->after('pending_email_status')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('pending_email_reviewed_at')->nullable()->after('pending_email_reviewed_by');
            $table->text('pending_email_rejection_reason')->nullable()->after('pending_email_reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pending_email_reviewed_by');
            $table->dropColumn([
                'pending_email_status',
                'pending_email_reviewed_at',
                'pending_email_rejection_reason',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const OLD_VALUES = [
        'tidak_berpenghasilan',
        'di_bawah_1jt',
        '1jt_2_5jt',
        '2_5jt_3_5jt',
        '3_5jt_5jt',
        '5jt_10jt',
        'di_atas_10jt',
    ];

    private const NEW_VALUE = 'tidak_ingin_memberitahu';

    public function up(): void
    {
        if (! $this->supportsEnumAlter()) {
            return;
        }

        $this->alterIncomeEnums([...self::OLD_VALUES, self::NEW_VALUE]);
    }

    public function down(): void
    {
        DB::table('guardians')
            ->where('father_income_range', self::NEW_VALUE)
            ->update(['father_income_range' => null]);

        DB::table('guardians')
            ->where('mother_income_range', self::NEW_VALUE)
            ->update(['mother_income_range' => null]);

        DB::table('guardians')
            ->where('guardian_income_range', self::NEW_VALUE)
            ->update(['guardian_income_range' => null]);

        if (! $this->supportsEnumAlter()) {
            return;
        }

        $this->alterIncomeEnums(self::OLD_VALUES);
    }

    private function supportsEnumAlter(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }

    /**
     * @param  array<int, string>  $values
     */
    private function alterIncomeEnums(array $values): void
    {
        $enumValues = collect($values)
            ->map(fn (string $value) => "'{$value}'")
            ->implode(',');

        foreach (['father_income_range', 'mother_income_range', 'guardian_income_range'] as $column) {
            DB::statement("ALTER TABLE guardians MODIFY {$column} ENUM({$enumValues}) NULL");
        }
    }
};

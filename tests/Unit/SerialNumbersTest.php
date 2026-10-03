<?php

namespace Tests\Unit;

use App\Helpers\SerialNumbers;
use PHPUnit\Framework\TestCase;

class SerialNumbersTest extends TestCase
{
    public function test_clean_trims_and_drops_blanks(): void
    {
        $this->assertSame(['356789104523871', 'SN 42'], SerialNumbers::clean(['  356789104523871 ', '', null, "SN \t 42"]));
        $this->assertSame([], SerialNumbers::clean(null));
        $this->assertSame([], SerialNumbers::clean('356789104523871'));
    }

    public function test_a_product_may_list_fewer_serial_numbers_than_units(): void
    {
        $this->assertSame([], SerialNumbers::productProblems(['A1', 'A2'], 5));
        $this->assertSame([], SerialNumbers::productProblems([], 0));
    }

    public function test_a_product_cannot_list_more_serial_numbers_than_units(): void
    {
        $problems = SerialNumbers::productProblems(['A1', 'A2', 'A3'], 2);

        $this->assertCount(1, $problems);
        $this->assertStringContainsString('3 serial numbers but the stock count is 2', $problems[0]);
    }

    public function test_a_product_cannot_list_the_same_serial_number_twice(): void
    {
        $this->assertSame(['Serial number abc123 is listed more than once.'], SerialNumbers::productProblems(['ABC123', 'abc123'], 2));
    }

    public function test_a_serial_number_has_a_maximum_length(): void
    {
        $this->assertCount(1, SerialNumbers::productProblems([str_repeat('9', SerialNumbers::MAX_LENGTH + 1)], 1));
    }
}

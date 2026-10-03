<?php

namespace Tests\Unit;

use App\Helpers\Money;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function test_whole_amounts_drop_the_kobo(): void
    {
        $this->assertSame('₦250,000', Money::naira('250000.00'));
        $this->assertSame('₦0', Money::naira(null));
    }

    public function test_amounts_with_kobo_keep_two_decimals(): void
    {
        $this->assertSame('₦305.37', Money::naira('305.37'));
        $this->assertSame('₦1,250.50', Money::naira(1250.5));
    }
}

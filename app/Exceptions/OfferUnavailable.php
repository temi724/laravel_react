<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * A deal or drop ran out (or ended) while an order was being placed.
 * The message is written for the customer and can be shown as it is.
 */
final class OfferUnavailable extends RuntimeException {}

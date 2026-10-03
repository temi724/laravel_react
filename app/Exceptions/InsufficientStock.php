<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * An order asks for more units of a product than the stock count holds.
 * The message is written for the admin and can be shown as it is.
 */
final class InsufficientStock extends RuntimeException {}

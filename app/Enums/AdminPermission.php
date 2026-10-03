<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * What an admin can be allowed to do. The super admin switches these on and off
 * per admin on the Settings page; a super admin always has all of them.
 */
enum AdminPermission: string
{
    case CreateProducts = 'products.create';
    case EditProducts = 'products.edit';
    case DeleteProducts = 'products.delete';
    case ExportProducts = 'products.export';
    case ManageCategories = 'categories.manage';
    case ManageOffers = 'offers.manage';
    case ViewSales = 'sales.view';
    case ApproveSales = 'sales.approve';
    case RecordOfflineSales = 'sales.offline';
    case ViewReports = 'reports.view';

    public function label(): string
    {
        return match ($this) {
            self::CreateProducts => 'Add products',
            self::EditProducts => 'Edit products',
            self::DeleteProducts => 'Delete products',
            self::ExportProducts => 'Export products',
            self::ManageCategories => 'Manage categories',
            self::ManageOffers => 'Manage offers',
            self::ViewSales => 'View sales and orders',
            self::ApproveSales => 'Approve orders',
            self::RecordOfflineSales => 'Record in-store sales',
            self::ViewReports => 'View reports',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CreateProducts => 'List new products and deals, one at a time or many at once from an Excel file.',
            self::EditProducts => 'Change prices, photos, stock counts and serial numbers.',
            self::DeleteProducts => 'Remove products and deals from the store.',
            self::ExportProducts => 'Download the product list, with stock and serial numbers, as an Excel file.',
            self::ManageCategories => 'Add, rename and remove product categories.',
            self::ManageOffers => 'Set the deal of the day, schedule drops and build bundles.',
            self::ViewSales => 'See orders, customer details and invoices.',
            self::ApproveSales => 'Mark payments as received and orders as completed.',
            self::RecordOfflineSales => 'Save sales made in the shop and print their receipts.',
            self::ViewReports => 'See revenue, top sellers and website analytics on the dashboard.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::CreateProducts, self::EditProducts, self::DeleteProducts, self::ExportProducts, self::ManageCategories, self::ManageOffers => 'Products',
            self::ViewSales, self::ApproveSales, self::RecordOfflineSales => 'Sales',
            self::ViewReports => 'Reports',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Every permission with its wording, for the Settings page.
     *
     * @return list<array{value: string, label: string, description: string, group: string}>
     */
    public static function catalogue(): array
    {
        return array_map(fn (self $permission) => [
            'value' => $permission->value,
            'label' => $permission->label(),
            'description' => $permission->description(),
            'group' => $permission->group(),
        ], self::cases());
    }
}

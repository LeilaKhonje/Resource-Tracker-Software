import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptionalResourceRequestVendor1762840000000
  implements MigrationInterface
{
  name = 'OptionalResourceRequestVendor1762840000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resource_request');
    if (!table) {
      throw new Error(
        'Cannot make resource request vendor optional: the resource_request table does not exist.',
      );
    }

    if (!table.findColumnByName('vendor')) {
      throw new Error(
        'Cannot make resource request vendor optional: the vendor column is missing.',
      );
    }

    await queryRunner.query(
      'ALTER TABLE `resource_request` MODIFY COLUMN `vendor` VARCHAR(255) NULL',
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible because new resource requests may have NULL vendor values.',
    );
  }
}

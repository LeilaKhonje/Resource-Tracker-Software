import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptionalLegacyResourceRequestFields1762830000000
  implements MigrationInterface
{
  name = 'OptionalLegacyResourceRequestFields1762830000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resource_request');
    if (!table) {
      throw new Error(
        'Cannot make legacy resource request fields optional: the resource_request table does not exist.',
      );
    }

    const price = table.findColumnByName('price');
    const manufacturerLabel = table.findColumnByName('manufacturerLabel');
    if (!price || !manufacturerLabel) {
      throw new Error(
        'Cannot make legacy resource request fields optional: price or manufacturerLabel column is missing.',
      );
    }

    await queryRunner.query(
      'ALTER TABLE `resource_request` MODIFY COLUMN `price` DECIMAL(12,2) NULL, MODIFY COLUMN `manufacturerLabel` VARCHAR(255) NULL',
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible because new resource requests may have NULL price and manufacturerLabel values.',
    );
  }
}

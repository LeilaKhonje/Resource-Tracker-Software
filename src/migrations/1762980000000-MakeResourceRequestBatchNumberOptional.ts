import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeResourceRequestBatchNumberOptional1762980000000
  implements MigrationInterface
{
  name = 'MakeResourceRequestBatchNumberOptional1762980000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resource_request');
    if (!table?.findColumnByName('batchNumber')) {
      throw new Error(
        'Cannot make resource request batchNumber optional: the column is missing.',
      );
    }

    await queryRunner.query(
      'ALTER TABLE `resource_request` MODIFY COLUMN `batchNumber` VARCHAR(255) NULL',
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible because resource requests may not have a batch number.',
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpectedDurationDaysToResourceRequests1762820000000
  implements MigrationInterface
{
  name = 'AddExpectedDurationDaysToResourceRequests1762820000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resource_request');
    if (!table) {
      throw new Error(
        'Cannot add expectedDurationDays: the resource_request table does not exist.',
      );
    }

    if (table.findColumnByName('expectedDurationDays')) return;

    await queryRunner.query(
      'ALTER TABLE `resource_request` ADD COLUMN `expectedDurationDays` INT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resource_request');
    if (table?.findColumnByName('expectedDurationDays')) {
      await queryRunner.query(
        'ALTER TABLE `resource_request` DROP COLUMN `expectedDurationDays`',
      );
    }
  }
}

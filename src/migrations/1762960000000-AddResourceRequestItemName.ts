import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResourceRequestItemName1762960000000 implements MigrationInterface {
  name = 'AddResourceRequestItemName1762960000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resource_request` ADD COLUMN `itemName` VARCHAR(150) NULL AFTER `id`',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resource_request` DROP COLUMN `itemName`',
    );
  }
}

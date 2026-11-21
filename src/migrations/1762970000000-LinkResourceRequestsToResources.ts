import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkResourceRequestsToResources1762970000000 implements MigrationInterface {
  name = 'LinkResourceRequestsToResources1762970000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resource_request'
         AND COLUMN_NAME = 'resourceId'`,
    );
    if (columns.length === 0) {
      await queryRunner.query('ALTER TABLE `resource_request` ADD COLUMN `resourceId` varchar(36) NULL');
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resource_request'
         AND COLUMN_NAME = 'resourceId'`,
    );
    if (columns.length > 0) {
      await queryRunner.query('ALTER TABLE `resource_request` DROP COLUMN `resourceId`');
    }
  }
}

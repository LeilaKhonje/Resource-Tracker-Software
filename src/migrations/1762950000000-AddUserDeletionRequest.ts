import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletionRequest1762950000000 implements MigrationInterface {
  name = 'AddUserDeletionRequest1762950000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'`,
    );
    if (users.length === 0) {
      throw new Error('Cannot add account deletion requests: users table does not exist.');
    }

    const deletionRequestedColumn = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'deletion_requested_at'`,
    );
    if (deletionRequestedColumn.length === 0) {
      await queryRunner.query('ALTER TABLE `users` ADD COLUMN `deletion_requested_at` DATETIME NULL');
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const deletionRequestedColumn = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'deletion_requested_at'`,
    );
    if (deletionRequestedColumn.length > 0) {
      await queryRunner.query('ALTER TABLE `users` DROP COLUMN `deletion_requested_at`');
    }
  }
}

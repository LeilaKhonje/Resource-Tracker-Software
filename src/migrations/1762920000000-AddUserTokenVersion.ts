import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTokenVersion1762920000000 implements MigrationInterface {
  name = 'AddUserTokenVersion1762920000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'`,
    );
    if (usersTable.length === 0) {
      throw new Error(
        'Cannot add user token versions: the users table does not exist.',
      );
    }

    const tokenVersionColumn = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'token_version'`,
    );
    if (tokenVersionColumn.length === 0) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `token_version` INT NOT NULL DEFAULT 0',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tokenVersionColumn = await queryRunner.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'token_version'`,
    );
    if (tokenVersionColumn.length > 0) {
      await queryRunner.query(
        'ALTER TABLE `users` DROP COLUMN `token_version`',
      );
    }
  }
}

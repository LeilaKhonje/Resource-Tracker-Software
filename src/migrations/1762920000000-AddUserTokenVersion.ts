import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTokenVersion1762920000000 implements MigrationInterface {
  name = 'AddUserTokenVersion1762920000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) {
      throw new Error(
        'Cannot add user token versions: the users table does not exist.',
      );
    }

    if (!usersTable.findColumnByName('token_version')) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `token_version` INT NOT NULL DEFAULT 0',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (usersTable?.findColumnByName('token_version')) {
      await queryRunner.query(
        'ALTER TABLE `users` DROP COLUMN `token_version`',
      );
    }
  }
}

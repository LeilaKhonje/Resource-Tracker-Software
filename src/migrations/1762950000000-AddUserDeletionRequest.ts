import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletionRequest1762950000000 implements MigrationInterface {
  name = 'AddUserDeletionRequest1762950000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable('users');
    if (!users) throw new Error('Cannot add account deletion requests: users table does not exist.');
    if (!users.findColumnByName('deletion_requested_at')) {
      await queryRunner.query('ALTER TABLE `users` ADD COLUMN `deletion_requested_at` DATETIME NULL');
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable('users');
    if (users?.findColumnByName('deletion_requested_at')) {
      await queryRunner.query('ALTER TABLE `users` DROP COLUMN `deletion_requested_at`');
    }
  }
}

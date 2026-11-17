import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetCode1762900000000 implements MigrationInterface {
  name = 'AddPasswordResetCode1762900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `password_reset_code_hash` varchar(64) NULL');
    await queryRunner.query('ALTER TABLE `users` ADD `password_reset_expires_at` datetime NULL');
    await queryRunner.query('ALTER TABLE `users` ADD `password_reset_attempts` tinyint NOT NULL DEFAULT 0');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `password_reset_attempts`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `password_reset_expires_at`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `password_reset_code_hash`');
  }
}

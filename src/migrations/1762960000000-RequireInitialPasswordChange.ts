import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequireInitialPasswordChange1762960000000 implements MigrationInterface {
  name = 'RequireInitialPasswordChange1762960000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD `must_change_password` tinyint NOT NULL DEFAULT 0',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` DROP COLUMN `must_change_password`',
    );
  }
}

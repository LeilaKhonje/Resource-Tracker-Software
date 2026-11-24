import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStructuredUserNames1762990000000 implements MigrationInterface {
  name = 'AddStructuredUserNames1762990000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD `first_name` varchar(120) NULL, ADD `middle_name` varchar(120) NULL, ADD `surname` varchar(120) NULL',
    );

    const users = (await queryRunner.query(
      'SELECT `id`, `full_name` AS `fullName` FROM `users`',
    )) as Array<{ id: string; fullName: string | null }>;

    for (const user of users) {
      const parts = (user.fullName ?? '').trim().split(/\s+/).filter(Boolean);
      const firstName = parts.shift() ?? '';
      const surname = parts.length > 0 ? parts.pop()! : '';
      const middleName = parts.join(' ') || null;
      await queryRunner.query(
        'UPDATE `users` SET `first_name` = ?, `middle_name` = ?, `surname` = ? WHERE `id` = ?',
        [firstName, middleName, surname, user.id],
      );
    }

    await queryRunner.query(
      'ALTER TABLE `users` MODIFY `first_name` varchar(120) NOT NULL, MODIFY `surname` varchar(120) NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` DROP COLUMN `surname`, DROP COLUMN `middle_name`, DROP COLUMN `first_name`',
    );
  }
}

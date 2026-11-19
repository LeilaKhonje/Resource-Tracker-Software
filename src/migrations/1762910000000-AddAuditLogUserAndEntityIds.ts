import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogUserAndEntityIds1762910000000
  implements MigrationInterface
{
  name = 'AddAuditLogUserAndEntityIds1762910000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('audit_logs');
    if (!table) {
      throw new Error(
        'Cannot add audit log identifiers: the audit_logs table does not exist.',
      );
    }

    for (const name of ['userId', 'entityId']) {
      const column = table.findColumnByName(name);
      if (!column) {
        await queryRunner.query(
          `ALTER TABLE \`audit_logs\` ADD COLUMN \`${name}\` VARCHAR(36) NULL`,
        );
      } else if (
        column.type.toLowerCase() !== 'varchar' ||
        Number(column.length) !== 36
      ) {
        await queryRunner.query(
          `ALTER TABLE \`audit_logs\` MODIFY COLUMN \`${name}\` VARCHAR(36) NULL`,
        );
      }
    }
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible because audit log identifiers may contain UUIDs.',
    );
  }
}

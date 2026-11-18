import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResourceStatus1762940000000 implements MigrationInterface {
  name = 'AddResourceStatus1762940000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const resourcesTable = await queryRunner.getTable('resources');
    if (!resourcesTable) {
      throw new Error('Cannot add resource statuses: the resources table does not exist.');
    }

    if (!resourcesTable.findColumnByName('status')) {
      await queryRunner.query(
        "ALTER TABLE `resources` ADD COLUMN `status` ENUM('AVAILABLE', 'ASSIGNED') NOT NULL DEFAULT 'AVAILABLE'",
      );
    }

    await queryRunner.query(`
      UPDATE resources
      SET status = CASE
        WHEN EXISTS (
          SELECT 1
          FROM resource_allocations AS allocation
          WHERE allocation.resource_id = resources.id
            AND allocation.status = 'ACTIVE'
        ) THEN 'ASSIGNED'
        ELSE 'AVAILABLE'
      END
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const resourcesTable = await queryRunner.getTable('resources');
    if (resourcesTable?.findColumnByName('status')) {
      await queryRunner.query('ALTER TABLE `resources` DROP COLUMN `status`');
    }
  }
}

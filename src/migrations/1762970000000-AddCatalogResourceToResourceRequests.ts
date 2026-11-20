import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogResourceToResourceRequests1762970000000
  implements MigrationInterface
{
  name = 'AddCatalogResourceToResourceRequests1762970000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const requestTable = await queryRunner.getTable('resource_request');
    const resourceTable = await queryRunner.getTable('resources');
    if (!requestTable || !resourceTable) {
      throw new Error('Cannot add the catalog resource link: required tables are missing.');
    }
    if (requestTable.findColumnByName('resource_id')) {
      throw new Error('Cannot add the catalog resource link: resource_id already exists.');
    }

    await queryRunner.query(
      'ALTER TABLE `resource_request` MODIFY COLUMN `itemDescription` TEXT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `resource_request` ADD COLUMN `resource_id` VARCHAR(36) NULL',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_resource_request_resource_id` ON `resource_request` (`resource_id`)',
    );
    await queryRunner.query(`
      ALTER TABLE `resource_request`
      ADD CONSTRAINT `FK_resource_request_resource_id`
      FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const requestTable = await queryRunner.getTable('resource_request');
    if (!requestTable?.findColumnByName('resource_id')) return;

    await queryRunner.query(`
      UPDATE `resource_request` request
      LEFT JOIN `resources` resource ON resource.id = request.resource_id
      SET request.itemDescription = COALESCE(request.itemDescription, resource.name, 'Resource')
      WHERE request.itemDescription IS NULL
    `);
    await queryRunner.query(
      'ALTER TABLE `resource_request` DROP FOREIGN KEY `FK_resource_request_resource_id`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_resource_request_resource_id` ON `resource_request`',
    );
    await queryRunner.query(
      'ALTER TABLE `resource_request` DROP COLUMN `resource_id`, MODIFY COLUMN `itemDescription` TEXT NOT NULL',
    );
  }
}

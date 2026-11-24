import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovedQuantityToResourceRequests1763000000000
  implements MigrationInterface
{
  name = 'AddApprovedQuantityToResourceRequests1763000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resource_request` ADD `approvedQuantity` int NULL',
    );
    await queryRunner.query(
      "UPDATE `resource_request` SET `approvedQuantity` = `quantity` WHERE `status` = 'APPROVED'",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resource_request` DROP COLUMN `approvedQuantity`',
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueDepartmentName1762810000000 implements MigrationInterface {
  name = 'UniqueDepartmentName1762810000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates = (await queryRunner.query(
      `SELECT name, COUNT(*) AS rowCount
       FROM department
       GROUP BY name
       HAVING COUNT(*) > 1
       LIMIT 1`,
    )) as Array<{ name: string; rowCount: number }>;

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot enforce unique department names: '${duplicates[0].name}' already exists more than once. Rename or remove duplicate departments, then rerun the migration.`,
      );
    }

    await queryRunner.query(
      'ALTER TABLE `department` ADD UNIQUE INDEX `UQ_department_name` (`name`)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `department` DROP INDEX `UQ_department_name`',
    );
  }
}

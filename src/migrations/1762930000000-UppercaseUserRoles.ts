import { MigrationInterface, QueryRunner } from 'typeorm';

type RoleKey = {
  column: string;
  index: string;
  role: 'MANAGING_DIRECTOR' | 'SYSTEM_ADMIN';
};

const ROLE_KEYS: RoleKey[] = [
  {
    column: 'managing_director_unique_role',
    index: 'IDX_users_single_managing_director',
    role: 'MANAGING_DIRECTOR',
  },
  {
    column: 'system_admin_unique_role',
    index: 'IDX_users_single_system_admin',
    role: 'SYSTEM_ADMIN',
  },
];

export class UppercaseUserRoles1762930000000 implements MigrationInterface {
  name = 'UppercaseUserRoles1762930000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) {
      throw new Error('Cannot uppercase user roles: the users table does not exist.');
    }

    await this.assertUniqueSingletonRoles(queryRunner);
    await this.dropRoleKeys(queryRunner);
    await queryRunner.query(
      'UPDATE `users` SET `role` = UPPER(`role`) WHERE `role` IS NOT NULL',
    );
    await this.createRoleKeys(queryRunner);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) return;

    await this.dropRoleKeys(queryRunner);
    await queryRunner.query(
      'UPDATE `users` SET `role` = LOWER(`role`) WHERE `role` IS NOT NULL',
    );
    await this.createRoleKeys(queryRunner, true);
  }

  private async assertUniqueSingletonRoles(queryRunner: QueryRunner): Promise<void> {
    const duplicates = (await queryRunner.query(
      `SELECT UPPER(role) AS role, COUNT(*) AS rowCount
       FROM users
       WHERE UPPER(role) IN ('MANAGING_DIRECTOR', 'SYSTEM_ADMIN')
       GROUP BY UPPER(role)
       HAVING COUNT(*) > 1`,
    )) as Array<{ role: string; rowCount: number }>;

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot uppercase user roles: duplicate ${duplicates[0].role} accounts exist. No schema or data change was made.`,
      );
    }
  }

  private async dropRoleKeys(queryRunner: QueryRunner): Promise<void> {
    for (const key of ROLE_KEYS) {
      const indexes = (await queryRunner.query(
        `SELECT s.INDEX_NAME AS indexName,
                s.NON_UNIQUE AS nonUnique,
                (SELECT COUNT(*)
                 FROM INFORMATION_SCHEMA.STATISTICS AS index_columns
                 WHERE index_columns.TABLE_SCHEMA = s.TABLE_SCHEMA
                   AND index_columns.TABLE_NAME = s.TABLE_NAME
                   AND index_columns.INDEX_NAME = s.INDEX_NAME) AS columnCount
         FROM INFORMATION_SCHEMA.STATISTICS AS s
         WHERE s.TABLE_SCHEMA = DATABASE()
           AND s.TABLE_NAME = 'users'
           AND s.COLUMN_NAME = ?
         GROUP BY s.INDEX_NAME, s.NON_UNIQUE, s.TABLE_SCHEMA, s.TABLE_NAME`,
        [key.column],
      )) as Array<{ indexName: string; nonUnique: number; columnCount: number }>;

      for (const index of indexes) {
        if (
          index.indexName !== key.index ||
          Number(index.nonUnique) !== 0 ||
          Number(index.columnCount) !== 1
        ) {
          throw new Error(
            `Cannot safely rebuild users.${key.column}: unexpected index ${index.indexName}.`,
          );
        }
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`${index.indexName}\``);
      }

      const [column] = (await queryRunner.query(
        `SELECT EXTRA AS extra
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = ?`,
        [key.column],
      )) as Array<{ extra: string }>;

      if (column) {
        if (!column.extra.toUpperCase().includes('GENERATED')) {
          throw new Error(
            `Cannot safely rebuild users.${key.column}: it is not a generated column.`,
          );
        }
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`${key.column}\``);
      }
    }
  }

  private async createRoleKeys(
    queryRunner: QueryRunner,
    lowercase = false,
  ): Promise<void> {
    for (const key of ROLE_KEYS) {
      const role = lowercase ? key.role.toLowerCase() : key.role;
      await queryRunner.query(
        `ALTER TABLE \`users\`
         ADD COLUMN \`${key.column}\` VARCHAR(32)
         GENERATED ALWAYS AS (
           CASE WHEN \`role\` = '${role}' THEN '${role}' ELSE NULL END
         ) VIRTUAL`,
      );
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD UNIQUE INDEX \`${key.index}\` (\`${key.column}\`)`,
      );
    }
  }
}

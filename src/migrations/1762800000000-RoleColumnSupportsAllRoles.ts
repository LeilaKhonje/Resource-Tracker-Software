import { MigrationInterface, QueryRunner } from 'typeorm';

type RoleKey = {
  column: string;
  index: string;
  role: 'managing_director' | 'system_admin';
};

const ROLE_KEYS: RoleKey[] = [
  {
    column: 'managing_director_unique_role',
    index: 'IDX_users_single_managing_director',
    role: 'managing_director',
  },
  {
    column: 'system_admin_unique_role',
    index: 'IDX_users_single_system_admin',
    role: 'system_admin',
  },
];

/**
 * Aligns users.role with User.role (nullable VARCHAR(32)). MySQL does not let
 * a base column be dropped/replaced while generated columns depend on it, so
 * when a type change is needed this migration removes and then recreates the
 * two virtual role-key columns and their unique indexes around that change.
 * Existing user rows and role values are retained.
 */
export class RoleColumnSupportsAllRoles1762800000000
  implements MigrationInterface
{
  name = 'RoleColumnSupportsAllRoles1762800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) {
      throw new Error(
        'Cannot migrate roles: the users table does not exist. Create the application schema before running migrations.',
      );
    }

    const [roleColumn] = (await queryRunner.query(
      `SELECT DATA_TYPE AS dataType,
              CHARACTER_MAXIMUM_LENGTH AS characterMaximumLength,
              IS_NULLABLE AS isNullable
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'role'`,
    )) as Array<{
      dataType: string;
      characterMaximumLength: number | null;
      isNullable: 'YES' | 'NO';
    }>;

    if (!roleColumn) {
      // Older installations may have the users table without a role field.
      // Roles are nullable so existing accounts remain valid and can be
      // assigned a business role through the application.
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `role` VARCHAR(32) NULL',
      );
    }

    const [oversizedRole] = (await queryRunner.query(
      `SELECT role
       FROM users
       WHERE CHAR_LENGTH(role) > 32
       LIMIT 1`,
    )) as Array<{ role: string }>;

    if (oversizedRole) {
      throw new Error(
        'Cannot migrate roles: a users.role value exceeds VARCHAR(32). No schema change was made.',
      );
    }

    const needsRoleChange = roleColumn && (
      roleColumn.dataType.toLowerCase() !== 'varchar' ||
      Number(roleColumn.characterMaximumLength) !== 32 ||
      roleColumn.isNullable !== 'YES'
    );

    if (needsRoleChange) {
      await this.assertUniqueRoleValues(queryRunner);
      await this.dropRoleKeys(queryRunner);
      await queryRunner.query(
        'ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(32) NULL',
      );
    }

    await this.ensureRoleKeys(queryRunner);
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible: converting role back to ENUM could reject or truncate existing role values.',
    );
  }

  private async assertUniqueRoleValues(queryRunner: QueryRunner): Promise<void> {
    const duplicates = (await queryRunner.query(
      `SELECT role, COUNT(*) AS rowCount
       FROM users
       WHERE role IN ('managing_director', 'system_admin')
       GROUP BY role
       HAVING COUNT(*) > 1`,
    )) as Array<{ role: string; rowCount: number }>;

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot rebuild role uniqueness indexes: duplicate ${duplicates[0].role} accounts exist. No schema change was made.`,
      );
    }
  }

  private async dropRoleKeys(queryRunner: QueryRunner): Promise<void> {
    for (const key of ROLE_KEYS) {
      const [column] = (await queryRunner.query(
        `SELECT EXTRA AS extra
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = ?`,
        [key.column],
      )) as Array<{ extra: string }>;

      if (!column) continue;
      if (!column.extra.toUpperCase().includes('GENERATED')) {
        throw new Error(
          `Cannot safely rebuild users.${key.column}: it exists but is not generated. No schema change was made.`,
        );
      }

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
      )) as Array<{
        indexName: string;
        nonUnique: number;
        columnCount: number;
      }>;

      for (const index of indexes) {
        if (
          index.indexName !== key.index ||
          Number(index.nonUnique) !== 0 ||
          Number(index.columnCount) !== 1
        ) {
          throw new Error(
            `Cannot safely rebuild users.${key.column}: unexpected index ${index.indexName}. No schema change was made.`,
          );
        }
        await queryRunner.query(
          `ALTER TABLE \`users\` DROP INDEX \`${index.indexName}\``,
        );
      }

      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`${key.column}\``,
      );
    }
  }

  private async ensureRoleKeys(queryRunner: QueryRunner): Promise<void> {
    for (const key of ROLE_KEYS) {
      const [column] = (await queryRunner.query(
        `SELECT EXTRA AS extra
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = ?`,
        [key.column],
      )) as Array<{ extra: string }>;

      if (!column) {
        await queryRunner.query(
          `ALTER TABLE \`users\`
           ADD COLUMN \`${key.column}\` VARCHAR(32)
           GENERATED ALWAYS AS (
             CASE WHEN \`role\` = '${key.role}' THEN '${key.role}' ELSE NULL END
           ) VIRTUAL`,
        );
      } else if (!column.extra.toUpperCase().includes('VIRTUAL GENERATED')) {
        throw new Error(
          `users.${key.column} must be a virtual generated column to match the User entity.`,
        );
      }

      const [index] = (await queryRunner.query(
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
      )) as Array<{
        indexName: string;
        nonUnique: number;
        columnCount: number;
      }>;

      if (
        index &&
        (index.indexName !== key.index ||
          Number(index.nonUnique) !== 0 ||
          Number(index.columnCount) !== 1)
      ) {
        throw new Error(
          `users.${key.column} has an unexpected index ${index.indexName}; refusing to alter it.`,
        );
      }
      if (!index) {
        await queryRunner.query(
          `ALTER TABLE \`users\` ADD UNIQUE INDEX \`${key.index}\` (\`${key.column}\`)`,
        );
      }
    }
  }
}

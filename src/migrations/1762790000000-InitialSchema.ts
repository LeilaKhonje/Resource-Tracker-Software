import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the application schema for databases that have no schema history
 * yet. Later migrations intentionally apply the role, department, and resource
 * request changes on top of this initial layout.
 */
export class InitialSchema1762790000000 implements MigrationInterface {
  name = 'InitialSchema1762790000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`department\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`code\` varchar(255) NULL,
        \`description\` varchar(500) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`team\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`description\` varchar(500) NOT NULL,
        \`department_id\` int NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_team_department\`
          FOREIGN KEY (\`department_id\`) REFERENCES \`department\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`full_name\` varchar(120) NOT NULL,
        \`email\` varchar(254) NOT NULL,
        \`password_hash\` varchar(128) NOT NULL,
        \`refresh_token_hash\` varchar(64) NULL,
        \`phone_number\` varchar(30) NULL,
        \`address\` varchar(255) NULL,
        \`date_of_birth\` date NULL,
        \`preferred_pronoun\` varchar(4) NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`role\` enum('system_admin','team_lead','line_manager','department_head','managing_director','team_member') NULL,
        \`department_id\` int NULL,
        \`team_id\` int NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_users_email\` (\`email\`),
        CONSTRAINT \`FK_users_department\`
          FOREIGN KEY (\`department_id\`) REFERENCES \`department\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_users_team\`
          FOREIGN KEY (\`team_id\`) REFERENCES \`team\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`project\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(150) NOT NULL,
        \`description\` varchar(1000) NULL,
        \`startDate\` date NULL,
        \`end_date\` date NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`project_teams_team\` (
        \`projectId\` int NOT NULL,
        \`teamId\` int NOT NULL,
        PRIMARY KEY (\`projectId\`, \`teamId\`),
        KEY \`IDX_project_teams_team_teamId\` (\`teamId\`),
        CONSTRAINT \`FK_project_teams_team_project\`
          FOREIGN KEY (\`projectId\`) REFERENCES \`project\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_project_teams_team_team\`
          FOREIGN KEY (\`teamId\`) REFERENCES \`team\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`resource_request\` (
        \`id\` varchar(36) NOT NULL,
        \`itemDescription\` text NOT NULL,
        \`manufacturerLabel\` varchar(255) NOT NULL,
        \`price\` decimal(12,2) NOT NULL,
        \`batchNumber\` varchar(255) NOT NULL,
        \`vendor\` varchar(255) NOT NULL,
        \`quantity\` int NOT NULL DEFAULT 1,
        \`status\` enum('SUBMITTED','QUERIED','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
        \`requestedBy\` varchar(255) NOT NULL,
        \`lineManagerId\` varchar(255) NOT NULL,
        \`projectId\` varchar(255) NOT NULL,
        \`teamId\` varchar(255) NULL,
        \`departmentId\` varchar(255) NULL,
        \`reviewNote\` text NULL,
        \`reviewedBy\` varchar(255) NULL,
        \`reviewedAt\` timestamp NULL,
        \`submittedAt\` timestamp NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`resources\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`type\` enum('insourced','outsourced') NOT NULL,
        \`description\` text NULL,
        \`department_id\` int NULL,
        \`price\` decimal(12,2) NULL,
        \`label\` varchar(100) NULL,
        \`batch_number\` varchar(100) NULL,
        \`vendor\` varchar(150) NULL,
        \`quantity\` int NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_resources_department\`
          FOREIGN KEY (\`department_id\`) REFERENCES \`department\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`resource_allocations\` (
        \`id\` varchar(36) NOT NULL,
        \`resource_id\` varchar(36) NOT NULL,
        \`quantity\` int NOT NULL,
        \`team_id\` int NOT NULL,
        \`project_id\` int NOT NULL,
        \`assigned_to_user_id\` varchar(36) NOT NULL,
        \`allocated_by_user_id\` varchar(36) NOT NULL,
        \`request_id\` varchar(36) NULL,
        \`status\` enum('ACTIVE','RETURNED','TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
        \`allocated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`expected_return_at\` timestamp NULL,
        \`returned_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_resource_allocations_resource\`
          FOREIGN KEY (\`resource_id\`) REFERENCES \`resources\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_allocations_team\`
          FOREIGN KEY (\`team_id\`) REFERENCES \`team\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_allocations_project\`
          FOREIGN KEY (\`project_id\`) REFERENCES \`project\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_allocations_assigned_user\`
          FOREIGN KEY (\`assigned_to_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_allocations_allocated_user\`
          FOREIGN KEY (\`allocated_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_allocations_request\`
          FOREIGN KEY (\`request_id\`) REFERENCES \`resource_request\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`resource_movements\` (
        \`id\` varchar(36) NOT NULL,
        \`resource_id\` varchar(36) NOT NULL,
        \`allocation_id\` varchar(36) NOT NULL,
        \`movementType\` enum('ALLOCATED','TRANSFERRED','RETURNED') NOT NULL,
        \`quantity\` int NOT NULL,
        \`from_user_id\` varchar(36) NULL,
        \`from_team_id\` int NULL,
        \`from_project_id\` int NULL,
        \`to_user_id\` varchar(36) NULL,
        \`to_team_id\` int NULL,
        \`to_project_id\` int NULL,
        \`performed_by_user_id\` varchar(36) NOT NULL,
        \`note\` text NULL,
        \`occurred_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_resource_movements_resource\`
          FOREIGN KEY (\`resource_id\`) REFERENCES \`resources\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_movements_allocation\`
          FOREIGN KEY (\`allocation_id\`) REFERENCES \`resource_allocations\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_resource_movements_performed_user\`
          FOREIGN KEY (\`performed_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`actionType\` varchar(100) NOT NULL,
        \`entityType\` varchar(100) NOT NULL,
        \`details\` text NULL,
        \`requestId\` varchar(36) NULL,
        \`action\` varchar(100) NULL,
        \`performedBy\` varchar(36) NULL,
        \`note\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`resource_request_audit\` (
        \`id\` varchar(36) NOT NULL,
        \`requestId\` varchar(255) NOT NULL,
        \`action\` varchar(255) NOT NULL,
        \`performedBy\` varchar(255) NOT NULL,
        \`note\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`message\` text NOT NULL,
        \`isRead\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `notification`');
    await queryRunner.query('DROP TABLE IF EXISTS `resource_request_audit`');
    await queryRunner.query('DROP TABLE IF EXISTS `audit_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `resource_movements`');
    await queryRunner.query('DROP TABLE IF EXISTS `resource_allocations`');
    await queryRunner.query('DROP TABLE IF EXISTS `resources`');
    await queryRunner.query('DROP TABLE IF EXISTS `resource_request`');
    await queryRunner.query('DROP TABLE IF EXISTS `project_teams_team`');
    await queryRunner.query('DROP TABLE IF EXISTS `users`');
    await queryRunner.query('DROP TABLE IF EXISTS `project`');
    await queryRunner.query('DROP TABLE IF EXISTS `team`');
    await queryRunner.query('DROP TABLE IF EXISTS `department`');
  }
}

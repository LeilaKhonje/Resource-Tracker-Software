import { randomUUID } from 'node:crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackableResourceUnits1763010000000
  implements MigrationInterface
{
  name = 'CreateTrackableResourceUnits1763010000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE resource_units (
        id varchar(36) NOT NULL,
        resource_id varchar(36) NOT NULL,
        unit_number int NOT NULL,
        serial_number varchar(100) NULL,
        asset_tag varchar(100) NULL,
        status enum('AVAILABLE','RESERVED','ALLOCATED') NOT NULL DEFAULT 'AVAILABLE',
        current_allocation_id varchar(36) NULL,
        reserved_for_request_id varchar(36) NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_resource_units_resource_number (resource_id, unit_number),
        UNIQUE KEY UQ_resource_units_asset_tag (asset_tag),
        CONSTRAINT FK_resource_units_resource
          FOREIGN KEY (resource_id) REFERENCES resources (id)
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_resource_units_current_allocation
          FOREIGN KEY (current_allocation_id) REFERENCES resource_allocations (id)
          ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT FK_resource_units_reserved_request
          FOREIGN KEY (reserved_for_request_id) REFERENCES resource_request (id)
          ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE resource_allocation_units (
        allocation_id varchar(36) NOT NULL,
        unit_id varchar(36) NOT NULL,
        PRIMARY KEY (allocation_id, unit_id),
        CONSTRAINT FK_resource_allocation_units_allocation
          FOREIGN KEY (allocation_id) REFERENCES resource_allocations (id)
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_resource_allocation_units_unit
          FOREIGN KEY (unit_id) REFERENCES resource_units (id)
          ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    const resources = (await queryRunner.query(
      'SELECT id, quantity FROM resources ORDER BY id',
    )) as Array<{ id: string; quantity: number }>;
    const unitIdsByResource = new Map<string, string[]>();
    for (const resource of resources) {
      const unitIds: string[] = [];
      const quantity = Math.max(0, Number(resource.quantity));
      for (let unitNumber = 1; unitNumber <= quantity; unitNumber += 1) {
        const id = randomUUID();
        unitIds.push(id);
        await queryRunner.query(
          "INSERT INTO resource_units (id, resource_id, unit_number, status) VALUES (?, ?, ?, 'AVAILABLE')",
          [id, resource.id, unitNumber],
        );
      }
      unitIdsByResource.set(resource.id, unitIds);
    }

    // Existing allocations did not record physical identities. Link active
    // quantities to generated units as placeholders so current inventory stays
    // accurate after the migration.
    const activeAllocations = (await queryRunner.query(
      "SELECT id, resource_id AS resourceId, quantity FROM resource_allocations WHERE status = 'ACTIVE' ORDER BY resource_id, allocated_at, id",
    )) as Array<{ id: string; resourceId: string; quantity: number }>;
    const nextUnitIndex = new Map<string, number>();
    for (const allocation of activeAllocations) {
      const unitIds = unitIdsByResource.get(allocation.resourceId) ?? [];
      const startIndex = nextUnitIndex.get(allocation.resourceId) ?? 0;
      const count = Number(allocation.quantity);
      if (startIndex + count > unitIds.length) {
        throw new Error(
          `Active allocations exceed recorded stock for resource ${allocation.resourceId}`,
        );
      }
      for (const unitId of unitIds.slice(startIndex, startIndex + count)) {
        await queryRunner.query(
          "UPDATE resource_units SET status = 'ALLOCATED', current_allocation_id = ? WHERE id = ?",
          [allocation.id, unitId],
        );
        await queryRunner.query(
          'INSERT INTO resource_allocation_units (allocation_id, unit_id) VALUES (?, ?)',
          [allocation.id, unitId],
        );
      }
      nextUnitIndex.set(allocation.resourceId, startIndex + count);
    }

    const approvedRequests = (await queryRunner.query(`
      SELECT request.id, request.resourceId,
        GREATEST(0, COALESCE(request.approvedQuantity, request.quantity) -
          COALESCE(SUM(allocation.quantity), 0)) AS quantity
      FROM resource_request request
      LEFT JOIN resource_allocations allocation ON allocation.request_id = request.id
      WHERE request.status = 'APPROVED' AND request.resourceId IS NOT NULL
      GROUP BY request.id, request.resourceId, request.approvedQuantity, request.quantity
      ORDER BY request.resourceId, request.createdAt, request.id
    `)) as Array<{ id: string; resourceId: string; quantity: number }>;
    for (const request of approvedRequests) {
      if (Number(request.quantity) === 0) continue;
      const reserved = (await queryRunner.query(
        "SELECT id FROM resource_units WHERE resource_id = ? AND status = 'AVAILABLE' ORDER BY unit_number LIMIT ?",
        [request.resourceId, Number(request.quantity)],
      )) as Array<{ id: string }>;
      if (reserved.length < Number(request.quantity)) {
        throw new Error(
          `Approved requests exceed available stock while migrating resource ${request.resourceId}`,
        );
      }
      for (const unit of reserved) {
        await queryRunner.query(
          "UPDATE resource_units SET status = 'RESERVED', reserved_for_request_id = ? WHERE id = ?",
          [request.id, unit.id],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE resource_allocation_units');
    await queryRunner.query('DROP TABLE resource_units');
  }
}

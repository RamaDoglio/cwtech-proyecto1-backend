import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMovimientoStock1789420000000
  implements MigrationInterface
{
  name = 'CreateMovimientoStock1789420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('movimiento_stock'))) {
      await queryRunner.query(`CREATE TABLE \`movimiento_stock\` (\`id\` int NOT NULL AUTO_INCREMENT, \`producto_id\` int NOT NULL, \`tipo\` enum('INGRESO','EGRESO','AJUSTE_MANUAL','AJUSTE_AUTOMATICO') NOT NULL, \`cantidad\` decimal(15,3) NOT NULL, \`motivo\` text NULL, \`usuario_id\` int NULL, \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_movimiento_stock_producto_id\` (\`producto_id\`), INDEX \`IDX_movimiento_stock_usuario_id\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    const tabla = await queryRunner.getTable('movimiento_stock');
    if (!tabla) {
      throw new Error('No se pudo crear la tabla movimiento_stock');
    }

    if (!tabla.foreignKeys.some((fk) => fk.columnNames.includes('producto_id'))) {
      await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_movimiento_stock_producto\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    if (!tabla.foreignKeys.some((fk) => fk.columnNames.includes('usuario_id'))) {
      await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_movimiento_stock_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('movimiento_stock')) {
      await queryRunner.query('DROP TABLE `movimiento_stock`');
    }
  }
}

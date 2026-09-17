import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistorialPrecio1789658000000
  implements MigrationInterface
{
  name = 'CreateHistorialPrecio1789658000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('historial_precio'))) {
      await queryRunner.query(`CREATE TABLE \`historial_precio\` (\`id\` int NOT NULL AUTO_INCREMENT, \`producto_id\` int NOT NULL, \`precioAnterior\` decimal(15,5) NOT NULL DEFAULT '0', \`precioNuevo\` decimal(15,5) NOT NULL DEFAULT '0', \`motivo\` text NOT NULL, \`usuario_id\` int NULL, \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_historial_precio_producto_id\` (\`producto_id\`), INDEX \`IDX_historial_precio_usuario_id\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    const tabla = await queryRunner.getTable('historial_precio');
    if (!tabla) {
      throw new Error('No se pudo crear la tabla historial_precio');
    }

    if (!tabla.foreignKeys.some((fk) => fk.columnNames.includes('producto_id'))) {
      await queryRunner.query(`ALTER TABLE \`historial_precio\` ADD CONSTRAINT \`FK_historial_precio_producto\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    if (!tabla.foreignKeys.some((fk) => fk.columnNames.includes('usuario_id'))) {
      await queryRunner.query(`ALTER TABLE \`historial_precio\` ADD CONSTRAINT \`FK_historial_precio_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('historial_precio')) {
      await queryRunner.query('DROP TABLE `historial_precio`');
    }
  }
}

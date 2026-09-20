import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuperLinea1789700000000 implements MigrationInterface {
  name = 'CreateSuperLinea1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla superlinea
    if (!(await queryRunner.hasTable('superlinea'))) {
      await queryRunner.query(
        `CREATE TABLE \`superlinea\` (` +
          `\`id\` int NOT NULL AUTO_INCREMENT, ` +
          `\`denominacion\` varchar(255) NOT NULL, ` +
          `\`observacion\` text NULL, ` +
          `\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ` +
          `\`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ` +
          `\`deletedAt\` datetime(6) NULL, ` +
          `\`usuarioCreatedId\` int NULL, ` +
          `\`usuarioDeletedId\` int NULL, ` +
          `\`usuarioUpdatedId\` int NULL, ` +
          `\`sistema\` int NOT NULL DEFAULT '0', ` +
          `UNIQUE INDEX \`IDX_superlinea_denominacion_deletedAt\` (\`denominacion\`, \`deletedAt\`), ` +
          `PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
      );
    }

    // 2. Insertar la SuperLínea de sistema "Sin clasificar"
    const existente: Array<{ id: number }> = await queryRunner.query(
      `SELECT \`id\` FROM \`superlinea\` WHERE \`denominacion\` = 'Sin clasificar' LIMIT 1`,
    );
    if (existente.length === 0) {
      await queryRunner.query(
        `INSERT INTO \`superlinea\` (\`denominacion\`, \`observacion\`, \`sistema\`) VALUES ('Sin clasificar', 'SuperLínea por defecto para Líneas sin clasificar', 1)`,
      );
    }

    // 3. Agregar columna superlinea_id a linea (nullable inicialmente)
    const tablaLinea = await queryRunner.getTable('linea');
    if (tablaLinea && !tablaLinea.columns.some((c) => c.name === 'superlinea_id')) {
      await queryRunner.query(
        `ALTER TABLE \`linea\` ADD \`superlinea_id\` int NULL`,
      );
    }

    // 4. Asignar todas las Líneas existentes a "Sin clasificar"
    await queryRunner.query(
      `UPDATE \`linea\` SET \`superlinea_id\` = (SELECT \`id\` FROM \`superlinea\` WHERE \`denominacion\` = 'Sin clasificar' LIMIT 1) WHERE \`superlinea_id\` IS NULL`,
    );

    // 5. Hacer la columna NOT NULL
    await queryRunner.query(
      `ALTER TABLE \`linea\` MODIFY \`superlinea_id\` int NOT NULL`,
    );

    // 6. Agregar FK (si no existe)
    const tablaLineaPost = await queryRunner.getTable('linea');
    if (
      tablaLineaPost &&
      !tablaLineaPost.foreignKeys.some((fk) =>
        fk.columnNames.includes('superlinea_id'),
      )
    ) {
      await queryRunner.query(
        `ALTER TABLE \`linea\` ADD CONSTRAINT \`FK_linea_superlinea\` FOREIGN KEY (\`superlinea_id\`) REFERENCES \`superlinea\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tablaLinea = await queryRunner.getTable('linea');
    if (
      tablaLinea &&
      tablaLinea.foreignKeys.some((fk) => fk.columnNames.includes('superlinea_id'))
    ) {
      await queryRunner.query(
        `ALTER TABLE \`linea\` DROP FOREIGN KEY \`FK_linea_superlinea\``,
      );
    }

    if (tablaLinea && tablaLinea.columns.some((c) => c.name === 'superlinea_id')) {
      await queryRunner.query(`ALTER TABLE \`linea\` DROP COLUMN \`superlinea_id\``);
    }

    if (await queryRunner.hasTable('superlinea')) {
      await queryRunner.query(
        `DROP INDEX \`IDX_superlinea_denominacion_deletedAt\` ON \`superlinea\``,
      );
      await queryRunner.query(`DROP TABLE \`superlinea\``);
    }
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PA-024 — Presentación del producto (CR-002; reglas del contenido en PA-023).
 *
 * La presentación es envase + valor + unidad, por ejemplo "BOTELLA 500 ml".
 *
 * 1. Crea el catálogo `envase_presentacion` (lo cargan los usuarios; mismas
 *    columnas que `marca`). No inserta datos: los envases iniciales van en el
 *    seed de familia de producto.
 * 2. Agrega a `producto` la FK `envase_presentacion_id` y las dos columnas del
 *    contenido. Son nulables, sin default y sin backfill: los productos
 *    existentes quedan sin presentación y se pueden seguir modificando.
 * 3. Agrega un CHECK: las tres columnas van juntas (todas en NULL o todas con
 *    valor) y el contenido respeta los rangos de PA-023. Las ramas con valor
 *    exigen IS NOT NULL: sin eso, un NULL hace que la expresión dé UNKNOWN y
 *    MySQL la toma como válida. MySQL aplica las CHECK desde la 8.0.16.
 *
 * Es idempotente: revisa tabla, columnas, índice, FK y CHECK antes de crearlos.
 *
 * ATENCIÓN: revertirla borra las presentaciones y los envases cargados
 * después de aplicarla.
 */
export class AgregarPresentacionProducto1789740326260
  implements MigrationInterface
{
  name = 'AgregarPresentacionProducto1789740326260';

  private static readonly COLUMNAS: Array<{ nombre: string; tipo: string }> = [
    { nombre: 'envase_presentacion_id', tipo: 'int' },
    { nombre: 'presentacionDimension', tipo: 'varchar(10)' },
    { nombre: 'presentacionMagnitudBase', tipo: 'int' },
  ];

  private static readonly INDICE = 'IDX_producto_envase_presentacion_id';
  private static readonly FK = 'FK_producto_envase_presentacion';
  private static readonly CHECK = 'CHK_producto_presentacion';

  private static readonly CONDICION_CHECK = `
    (\`envase_presentacion_id\` IS NULL
      AND \`presentacionDimension\` IS NULL
      AND \`presentacionMagnitudBase\` IS NULL)
    OR (
      \`envase_presentacion_id\` IS NOT NULL
      AND \`presentacionDimension\` IS NOT NULL
      AND \`presentacionMagnitudBase\` IS NOT NULL
      AND (
        (\`presentacionDimension\` IN ('VOLUMEN', 'MASA') AND \`presentacionMagnitudBase\` BETWEEN 1 AND 1000000)
        OR (\`presentacionDimension\` = 'UNIDADES' AND \`presentacionMagnitudBase\` BETWEEN 1 AND 10000)
      )
    )`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const log = (msg: string) => console.log(`[PA-024] ${msg}`);
    const migracion = AgregarPresentacionProducto1789740326260;

    // 1. Catálogo de envases
    if (await queryRunner.hasTable('envase_presentacion')) {
      log('tabla `envase_presentacion` ya existe, nada que hacer');
    } else {
      await queryRunner.query(`
        CREATE TABLE \`envase_presentacion\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`denominacion\` varchar(255) NOT NULL,
          \`observacion\` text NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          \`deletedAt\` datetime(6) NULL,
          \`usuarioCreatedId\` int NULL,
          \`usuarioDeletedId\` int NULL,
          \`usuarioUpdatedId\` int NULL,
          \`sistema\` int NOT NULL DEFAULT 0,
          UNIQUE INDEX \`UQ_envase_presentacion_denominacion\` (\`denominacion\`, \`deletedAt\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
      log('tabla `envase_presentacion` creada');
    }

    // 2. Columnas de la presentación en producto
    for (const columna of migracion.COLUMNAS) {
      if (await queryRunner.hasColumn('producto', columna.nombre)) {
        log(`columna \`${columna.nombre}\` ya existe, nada que hacer`);
        continue;
      }
      await queryRunner.query(
        `ALTER TABLE \`producto\` ADD \`${columna.nombre}\` ${columna.tipo} NULL`,
      );
      log(`columna \`${columna.nombre}\` agregada`);
    }

    const producto = await queryRunner.getTable('producto');
    if (!producto?.indices.some((i) => i.name === migracion.INDICE)) {
      await queryRunner.query(
        `CREATE INDEX \`${migracion.INDICE}\` ON \`producto\` (\`envase_presentacion_id\`)`,
      );
      log(`índice \`${migracion.INDICE}\` creado`);
    }

    if (!producto?.foreignKeys.some((fk) => fk.name === migracion.FK)) {
      await queryRunner.query(
        `ALTER TABLE \`producto\` ADD CONSTRAINT \`${migracion.FK}\` ` +
          'FOREIGN KEY (`envase_presentacion_id`) REFERENCES `envase_presentacion`(`id`) ' +
          'ON DELETE NO ACTION ON UPDATE NO ACTION',
      );
      log(`FK \`${migracion.FK}\` creada`);
    }

    // 3. Restricción
    if (await migracion.existeCheck(queryRunner, migracion.CHECK)) {
      log(`restricción \`${migracion.CHECK}\` ya existe, nada que hacer`);
    } else {
      await queryRunner.query(
        `ALTER TABLE \`producto\` ADD CONSTRAINT \`${migracion.CHECK}\` CHECK (${migracion.CONDICION_CHECK})`,
      );
      log(`restricción \`${migracion.CHECK}\` agregada`);
    }

    // Informativo, no es un error: los productos existentes no tienen presentación.
    const [{ cantidad }]: Array<{ cantidad: string | number }> =
      await queryRunner.query(
        'SELECT COUNT(*) AS cantidad FROM `producto` WHERE `envase_presentacion_id` IS NULL',
      );
    log(`${cantidad} producto(s) sin presentación`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const log = (msg: string) => console.log(`[PA-024] ${msg}`);
    const migracion = AgregarPresentacionProducto1789740326260;

    // Orden inverso: CHECK y FK antes que las columnas, y las columnas antes que la tabla.
    if (await migracion.existeCheck(queryRunner, migracion.CHECK)) {
      await queryRunner.query(
        `ALTER TABLE \`producto\` DROP CHECK \`${migracion.CHECK}\``,
      );
      log(`restricción \`${migracion.CHECK}\` eliminada`);
    }

    const producto = await queryRunner.getTable('producto');
    if (producto?.foreignKeys.some((fk) => fk.name === migracion.FK)) {
      await queryRunner.query(
        `ALTER TABLE \`producto\` DROP FOREIGN KEY \`${migracion.FK}\``,
      );
      log(`FK \`${migracion.FK}\` eliminada`);
    }
    if (producto?.indices.some((i) => i.name === migracion.INDICE)) {
      await queryRunner.query(
        `DROP INDEX \`${migracion.INDICE}\` ON \`producto\``,
      );
      log(`índice \`${migracion.INDICE}\` eliminado`);
    }

    for (const columna of [...migracion.COLUMNAS].reverse()) {
      if (await queryRunner.hasColumn('producto', columna.nombre)) {
        await queryRunner.query(
          `ALTER TABLE \`producto\` DROP COLUMN \`${columna.nombre}\``,
        );
        log(`columna \`${columna.nombre}\` eliminada`);
      }
    }

    if (await queryRunner.hasTable('envase_presentacion')) {
      await queryRunner.query('DROP TABLE `envase_presentacion`');
      log('tabla `envase_presentacion` eliminada');
    }
  }

  private static async existeCheck(
    queryRunner: QueryRunner,
    nombre: string,
  ): Promise<boolean> {
    const filas: unknown[] = await queryRunner.query(
      `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'producto'
         AND CONSTRAINT_TYPE = 'CHECK' AND CONSTRAINT_NAME = ?`,
      [nombre],
    );
    return filas.length > 0;
  }
}

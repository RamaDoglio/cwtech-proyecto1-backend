import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCambioPreciosMasivoHistorial1789571607817 implements MigrationInterface {
    name = 'CreateCambioPreciosMasivoHistorial1789571607817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` DROP FOREIGN KEY \`FK_movimiento_stock_producto\``);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` DROP FOREIGN KEY \`FK_movimiento_stock_usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_movimiento_stock_producto_id\` ON \`movimiento_stock\``);
        await queryRunner.query(`DROP INDEX \`IDX_movimiento_stock_usuario_id\` ON \`movimiento_stock\``);
        await queryRunner.query(`CREATE TABLE \`cambio_precios_masivo_historial\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo\` int NOT NULL, \`valor\` decimal(15,5) NOT NULL, \`alcance\` enum ('LINEA', 'GLOBAL') NOT NULL, \`lineaId\` int NULL, \`cantidadProductosAfectados\` int NOT NULL, \`usuarioId\` int NOT NULL, \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuario_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE INDEX \`IDX_710f568fa31814d122557802f6\` ON \`movimiento_stock\` (\`producto_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_7bcb47a863c1926656d60d2e0a\` ON \`movimiento_stock\` (\`usuario_id\`)`);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_710f568fa31814d122557802f62\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_7bcb47a863c1926656d60d2e0a4\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cambio_precios_masivo_historial\` ADD CONSTRAINT \`FK_7b27be3f18110ae11bcffa171ae\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cambio_precios_masivo_historial\` DROP FOREIGN KEY \`FK_7b27be3f18110ae11bcffa171ae\``);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` DROP FOREIGN KEY \`FK_7bcb47a863c1926656d60d2e0a4\``);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` DROP FOREIGN KEY \`FK_710f568fa31814d122557802f62\``);
        await queryRunner.query(`DROP INDEX \`IDX_7bcb47a863c1926656d60d2e0a\` ON \`movimiento_stock\``);
        await queryRunner.query(`DROP INDEX \`IDX_710f568fa31814d122557802f6\` ON \`movimiento_stock\``);
        await queryRunner.query(`DROP TABLE \`cambio_precios_masivo_historial\``);
        await queryRunner.query(`CREATE INDEX \`IDX_movimiento_stock_usuario_id\` ON \`movimiento_stock\` (\`usuario_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_movimiento_stock_producto_id\` ON \`movimiento_stock\` (\`producto_id\`)`);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_movimiento_stock_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`movimiento_stock\` ADD CONSTRAINT \`FK_movimiento_stock_producto\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

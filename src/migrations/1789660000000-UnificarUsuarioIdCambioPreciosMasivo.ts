import { MigrationInterface, QueryRunner } from "typeorm";

export class UnificarUsuarioIdCambioPreciosMasivo1789660000000 implements MigrationInterface {
    name = 'UnificarUsuarioIdCambioPreciosMasivo1789660000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE \`cambio_precios_masivo_historial\` SET \`usuario_id\` = \`usuarioId\` WHERE \`usuario_id\` IS NULL AND \`usuarioId\` IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cambio_precios_masivo_historial\` DROP COLUMN \`usuarioId\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cambio_precios_masivo_historial\` ADD \`usuarioId\` int NULL`);
        await queryRunner.query(`UPDATE \`cambio_precios_masivo_historial\` SET \`usuarioId\` = \`usuario_id\``);
        await queryRunner.query(`ALTER TABLE \`cambio_precios_masivo_historial\` MODIFY \`usuarioId\` int NOT NULL`);
    }

}

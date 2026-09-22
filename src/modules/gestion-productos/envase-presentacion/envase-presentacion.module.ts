import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works1';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { UsuarioModule } from 'src/modules/gestion-usuario/usuario/usuario.module';
import { ProductoModule } from '../producto/producto.module';
import { EnvasePresentacionController } from './application/controllers/envase-presentacion.controller';
import { EnvasePresentacionService } from './application/services/envase-presentacion.service';
import { EnvasePresentacion } from './domain/entities/envase-presentacion.entity';
import { PoliticaEliminacionEnvasePresentacion } from './domain/services/politica-eliminacion-envase-presentacion.service';
import { EnvasePresentacionPersistenceAdapter } from './infraestructure/repositories/envase-presentacion.persistence-adapters';
import { EnvasePresentacionRepository } from './infraestructure/repositories/envase-presentacion.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnvasePresentacion]),
    UsuarioModule,
    forwardRef(() => ProductoModule),
  ],
  controllers: [EnvasePresentacionController],
  providers: [
    EnvasePresentacionService,
    NormalizeDenominacionPipe,
    EnvasePresentacionPersistenceAdapter,
    PoliticaEliminacionEnvasePresentacion,
    {
      provide: 'IEnvasePresentacionRepository',
      useClass: EnvasePresentacionRepository,
    },
    {
      provide: 'UnitOfWork',
      useFactory: (dataSource: DataSource): IUnitOfWork =>
        new TypeOrmUnitOfWork(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [TypeOrmModule, EnvasePresentacionService],
})
export class EnvasePresentacionModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { EnvasePresentacion } from 'src/modules/gestion-productos/envase-presentacion/domain/entities/envase-presentacion.entity';

import { SeedProductoService } from './seed-producto.service';
import { SeedProductoController } from './seed-producto.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Linea,
      Marca,
      Proveedor,
      Usuario,
      EnvasePresentacion,
    ]),
  ],
  controllers: [SeedProductoController],
  providers: [SeedProductoService],
  exports: [SeedProductoService],
})
export class SeedProductoModule {}

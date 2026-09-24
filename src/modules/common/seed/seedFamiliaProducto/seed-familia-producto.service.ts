import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { EnvasePresentacion } from 'src/modules/gestion-productos/envase-presentacion/domain/entities/envase-presentacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class SeedFamiliaProductoService {
  constructor(

    @InjectRepository(Linea)
    private readonly lineaRepository: Repository<Linea>,

    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,

    @InjectRepository(SuperLinea)
    private readonly superLineaRepository: Repository<SuperLinea>,
    @InjectRepository(EnvasePresentacion)
    private readonly envasePresentacionRepository: Repository<EnvasePresentacion>,



    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,


  ) {}


  async seedLineas() {
    const superLineaDefault = await this.superLineaRepository.findOneBy({
      denominacion: 'Sin clasificar',
    });

    if (!superLineaDefault) {
      console.log(
        '⚠️ No se encontró la superlínea por defecto "Sin clasificar".',
      );
      return;
    }

    const entryData = [
      {
        denominacion: 'Aceites',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Aceitunas',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Azucar',
        sistema: 0,
        usuarioCreatedId: 1,
      },
    
      {
        denominacion: 'BOLSAS',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Chocolates',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'HARINAS',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'MARGARINAS Y GRASAS',
        sistema: 0,
        usuarioCreatedId: 1,
      },

    
    ];

    for (const data of entryData) {
      const exists = await this.lineaRepository.findOneBy({
        denominacion: data.denominacion.toUpperCase(),
      });

      if (!exists) {
        
        const usuarioCreated = await this.usuarioRepository.findOneBy({
          id: data.usuarioCreatedId,
        });

        if (!usuarioCreated) {
          console.log(
            `⚠️ No se encontró el usuario "${data.usuarioCreatedId}".`,
          );
          continue; // Evita crear la línea sin superlínea
        }

        const linea = this.lineaRepository.create({
          denominacion: data.denominacion.toUpperCase(),
          sistema: data.sistema,
          superlinea: superLineaDefault,
          usuarioCreatedId: usuarioCreated.id,
        } as DeepPartial<Linea>);

        await this.lineaRepository.save(linea);
        console.log(`✅ Linea "${data.denominacion}" creada.`);
      } else {
        console.log(`⚠️ Linea "${data.denominacion}" ya existe.`);
      }
    }
  }

  // Seed de Marcas
  async seedMarcas() {
    const entryData = [
      { denominacion: 'SIN MARCA', usuarioCreatedId: 1, sistema: 0 },
      { denominacion: 'CAROYENSE', usuarioCreatedId: 1, sistema: 0 },
      { denominacion: 'CIRCE', usuarioCreatedId: 1, sistema: 0 },
    
    ];

    for (const data of entryData) {
      const exists = await this.marcaRepository.findOneBy({
        denominacion: data.denominacion,
      });

      if (!exists) {
        const usuarioCreated = await this.usuarioRepository.findOneBy({
          id: data.usuarioCreatedId,
        });

        if (!usuarioCreated) {
          console.log(
            `⚠️ No se encontró el usuario "${data.usuarioCreatedId}".`,
          );
          continue; // Evita crear la línea sin superlínea
        }

        const marca = this.marcaRepository.create({
          denominacion: data.denominacion.toUpperCase(),
          usuarioCreatedId: usuarioCreated.id,
          sistema: data.sistema,
        } as DeepPartial<Marca>);

        await this.marcaRepository.save(marca);
        console.log(`✅ Marca "${data.denominacion}" creada.`);
      } else {
        console.log(`⚠️ Marca "${data.denominacion}" ya existe.`);
      }
    }
  }


  // Seed de envases de la presentación (CR-002). Los usuarios pueden crear más.
  async seedEnvasesPresentacion() {
    const denominaciones = [
      'BOTELLA',
      'BOLSA',
      'BOLSÓN',
      'CAJA',
      'LATA',
      'FRASCO',
      'PAQUETE',
      'SACHET',
    ];
    const usuarioCreatedId = 1;

    const usuarioCreated = await this.usuarioRepository.findOneBy({
      id: usuarioCreatedId,
    });
    if (!usuarioCreated) {
      console.log(`⚠️ No se encontró el usuario "${usuarioCreatedId}".`);
      return;
    }

    for (const denominacion of denominaciones) {
      const exists = await this.envasePresentacionRepository.findOneBy({
        denominacion,
      });

      if (exists) {
        console.log(`⚠️ Envase de presentación "${denominacion}" ya existe.`);
        continue;
      }

      await this.envasePresentacionRepository.save(
        this.envasePresentacionRepository.create({
          denominacion,
          sistema: 0,
          usuarioCreatedId: usuarioCreated.id,
        }),
      );
      console.log(`✅ Envase de presentación "${denominacion}" creado.`);
    }
  }

  async runAllSeeds() {
    console.log('🚀 Iniciando todos los seeds...');


   await  this.seedLineas();
    await this.seedMarcas();
    await this.seedEnvasesPresentacion();

    console.log('✅ Todos los seeds completados.');
  }
}

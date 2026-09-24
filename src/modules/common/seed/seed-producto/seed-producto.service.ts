import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';

@Injectable()
export class SeedProductoService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Linea)
    private readonly lineaRepository: Repository<Linea>,

    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,

    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seedProductos() {
    const usuarioCreatedId = 1;
    const usuarioCreated = await this.usuarioRepository.findOneBy({
      id: usuarioCreatedId,
    });

    if (!usuarioCreated) {
      console.log(`⚠️ No se encontró el usuario "${usuarioCreatedId}".`);
      return;
    }

    const entryData = [
      {
        denominacion: 'Aceite Girasol 1.5L',
        codigoProveedor: 'ACE-001',
        linea: 'ACEITES',
        marca: 'CAROYENSE',
        proveedor: 'PROVEEDOR 1.',
        alicuotaIva: 21,
        costo: 800,
        precio: 1200,
        stock: 50,
      },
      {
        denominacion: 'Aceitunas Verdes Frasco 200g',
        codigoProveedor: 'ACT-001',
        linea: 'ACEITUNAS',
        marca: 'CIRCE',
        proveedor: 'PROVEEDOR 1.',
        alicuotaIva: 21,
        costo: 350,
        precio: 550,
        stock: 80,
      },
      {
        denominacion: 'Azucar Blanca 1Kg',
        codigoProveedor: 'AZU-001',
        linea: 'AZUCAR',
        marca: 'SIN MARCA',
        proveedor: 'PROVEEDOR 2.',
        alicuotaIva: 10.5,
        costo: 500,
        precio: 750,
        stock: 120,
      },
      {
        denominacion: 'Bolsas Camiseta x50',
        codigoProveedor: 'BOL-001',
        linea: 'BOLSAS',
        marca: 'SIN MARCA',
        proveedor: 'PROVEEDOR 2.',
        alicuotaIva: 21,
        costo: 200,
        precio: 350,
        stock: 200,
      },
      {
        denominacion: 'Chocolate en Barra 100g',
        codigoProveedor: 'CHO-001',
        linea: 'CHOCOLATES',
        marca: 'CIRCE',
        proveedor: 'PROVEEDOR 1.',
        alicuotaIva: 21,
        costo: 400,
        precio: 650,
        stock: 60,
      },
      {
        denominacion: 'Harina 0000 1Kg',
        codigoProveedor: 'HAR-001',
        linea: 'HARINAS',
        marca: 'CAROYENSE',
        proveedor: 'PROVEEDOR 2.',
        alicuotaIva: 10.5,
        costo: 300,
        precio: 480,
        stock: 150,
      },
      {
        denominacion: 'Margarina 500g',
        codigoProveedor: 'MAR-001',
        linea: 'MARGARINAS Y GRASAS',
        marca: 'SIN MARCA',
        proveedor: 'PROVEEDOR 1.',
        alicuotaIva: 21,
        costo: 450,
        precio: 700,
        stock: 40,
      },
    ];

    for (const data of entryData) {
      const exists = await this.productoRepository.findOneBy({
        codigoProveedor: data.codigoProveedor,
      });

      if (exists) {
        console.log(`⚠️ Producto "${data.denominacion}" ya existe.`);
        continue;
      }

      const linea = await this.lineaRepository.findOneBy({
        denominacion: data.linea,
      });
      const marca = await this.marcaRepository.findOneBy({
        denominacion: data.marca,
      });
      const proveedor = await this.proveedorRepository.findOneBy({
        denominacion: data.proveedor,
      });

      if (!linea || !marca || !proveedor) {
        console.log(
          `⚠️ No se pudo crear "${data.denominacion}": falta linea, marca o proveedor. Corré el seed de familia de producto y organización primero.`,
        );
        continue;
      }

      const producto = this.productoRepository.create({
        denominacion: data.denominacion,
        codigoProveedor: data.codigoProveedor,
        linea,
        marca,
        proveedor,
        alicuotaIva: data.alicuotaIva,
        costo: data.costo,
        precio: data.precio,
        stock: data.stock,
        usuarioCreated,
      } as DeepPartial<Producto>);

      await this.productoRepository.save(producto);
      console.log(`✅ Producto "${data.denominacion}" creado.`);
    }
  }

  async runAllSeeds() {
    console.log('🚀 Iniciando seed de productos...');
    await this.seedProductos();
    console.log('✅ Seed de productos completado.');
  }
}

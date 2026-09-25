import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { EnvasePresentacion } from 'src/modules/gestion-productos/envase-presentacion/domain/entities/envase-presentacion.entity';

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

    @InjectRepository(EnvasePresentacion)
    private readonly envaseRepository: Repository<EnvasePresentacion>,
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

    const catalogos = [
      ['ACE', 'Aceite de girasol', 'ACEITES', 'NATURA', 'BOTELLA', 'VOLUMEN', 'ml', 1800, 21],
      ['ARR', 'Arroz largo fino', 'ARROCES', 'MOLINOS', 'BOLSA', 'MASA', 'g', 1100, 10.5],
      ['GAL', 'Galletitas surtidas', 'GALLETITAS', 'ARCOR', 'PAQUETE', 'MASA', 'g', 900, 21],
      ['CHO', 'Chocolate con leche', 'CHOCOLATES', 'ARCOR', 'TABLETA', 'MASA', 'g', 1300, 21],
      ['GAS', 'Gaseosa cola', 'GASEOSAS', 'COCA-COLA', 'BOTELLA', 'VOLUMEN', 'ml', 1600, 21],
      ['AGU', 'Agua mineral', 'AGUAS', 'NATURA', 'BOTELLA', 'VOLUMEN', 'ml', 700, 21],
      ['LEC', 'Leche entera', 'LECHES', 'LA SERENISIMA', 'BOTELLA', 'VOLUMEN', 'ml', 1500, 10.5],
      ['DET', 'Detergente concentrado', 'DETERGENTES', 'AYUDIN', 'BOTELLA', 'VOLUMEN', 'ml', 1200, 21],
      ['JAB', 'Jabon de tocador', 'JABONES', 'REXONA', 'PAQUETE', 'MASA', 'g', 950, 21],
      ['BOL', 'Bolsas camiseta', 'BOLSAS', 'SIN MARCA', 'BOLSA', 'UNIDADES', 'unidades', 800, 21],
    ].map(([codigo, descripcion, linea, marca, envase, dimension, unidad, costo, alicuota]) => ({
      codigo: codigo as string,
      descripcion: descripcion as string,
      linea: linea as string,
      marca: marca as string,
      envase: envase as string,
      dimension: dimension as string,
      unidad: unidad as string,
      costo: costo as number,
      alicuotaIva: alicuota as number,
    }));

    const cantidades = [500, 900, 1000, 1500, 2000];
    const entryData = catalogos.flatMap((catalogo) =>
      cantidades.map((cantidad, index) => ({
        denominacion: `${catalogo.marca} ${catalogo.descripcion} ${cantidad}${catalogo.unidad}`,
        codigoProveedor: `${catalogo.codigo}-${String(index + 1).padStart(3, '0')}`,
        ...catalogo,
        cantidad,
        proveedor: index % 2 === 0 ? 'PROVEEDOR 1.' : 'PROVEEDOR 2.',
        precio: Math.round(catalogo.costo * (1.35 + index * 0.05)),
        stock: 20 + index * 15,
      })),
    );

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
      const envase = await this.envaseRepository.findOneBy({
        denominacion: data.envase,
      });

      if (!linea || !marca || !proveedor || !envase) {
        console.log(
          `⚠️ No se pudo crear "${data.denominacion}": falta una relación del catálogo. Corré primero el seed completo.`,
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
        stockMinimo: 10,
        utilizaStockMinimo: true,
        envasePresentacion: envase,
        envasePresentacionId: envase.id,
        presentacionDimension: data.dimension,
        presentacionMagnitudBase:
          data.dimension === 'VOLUMEN' || data.dimension === 'MASA'
            ? data.unidad === 'ml' || data.unidad === 'g'
              ? data.cantidad
              : data.cantidad * 1000
            : data.cantidad,
        codigoReferencia: `REF-${data.codigoProveedor}`,
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

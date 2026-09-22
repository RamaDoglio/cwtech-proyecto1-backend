import { Producto } from '../domain/entities/producto.entity';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Linea } from '../../linea/domain/entities/linea.entity';
import { Marca } from '../../marca/domain/entities/marca.entity';
import { EnvasePresentacion } from '../../envase-presentacion/domain/entities/envase-presentacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ProductoMapper } from './producto.mapper';

const linea = { id: 1, denominacion: 'ACEITES' } as Linea;
const marca = { id: 1, denominacion: 'NATURA' } as Marca;
const usuario = { id: 1 } as Usuario;
const botella = { id: 1, denominacion: 'BOTELLA' } as EnvasePresentacion;

const producto = (columnas: Partial<Producto> = {}) =>
  Object.assign(new Producto(), {
    id: 1,
    denominacion: 'ACEITE GIRASOL NATURA',
    stock: 10,
    costo: 100,
    precio: 115,
    porcentaje: 15,
    alicuotaIva: 21,
    linea,
    marca,
    envasePresentacionId: null,
    presentacionDimension: null,
    presentacionMagnitudBase: null,
    ...columnas,
  });

const botella1500 = {
  envasePresentacionId: 1,
  envasePresentacion: botella,
  presentacionDimension: 'VOLUMEN',
  presentacionMagnitudBase: 1500,
};

const columnasPresentacion = (entidad: Producto) => [
  entidad.envasePresentacionId,
  entidad.presentacionDimension,
  entidad.presentacionMagnitudBase,
];

describe('ProductoMapper — presentación', () => {
  describe.each([
    ['toDto', (entidad: Producto) => ProductoMapper.toDto(entidad)],
    ['toBusquedaDto', (entidad: Producto) => ProductoMapper.toBusquedaDto(entidad)],
  ])('%s', (_nombre, mapear) => {
    it('devuelve presentacion null si el producto no tiene', () => {
      expect(mapear(producto()).presentacion).toBeNull();
    });

    it('devuelve el envase, el contenido normalizado y el texto', () => {
      expect(mapear(producto(botella1500)).presentacion).toEqual({
        envase: { id: 1, denominacion: 'BOTELLA' },
        contenido: { cantidad: 1.5, unidad: 'L' },
        texto: 'BOTELLA 1.5 L',
      });
    });
  });

  it('toBusquedaDto funciona pasado suelto a map(), como lo usa el servicio', () => {
    const [dto] = [producto(botella1500)].map(ProductoMapper.toBusquedaDto);

    expect(dto.presentacion?.texto).toBe('BOTELLA 1.5 L');
  });

  it('acepta objetos planos además de instancias de Producto', () => {
    const plano = { ...producto(), ...botella1500 } as Producto;

    expect(ProductoMapper.toDto(plano).presentacion?.texto).toBe('BOTELLA 1.5 L');
  });

  it('sin la relación cargada, devuelve el id del envase y el texto solo con el contenido', () => {
    const { envasePresentacion: _envase, ...sinRelacion } = botella1500;

    expect(ProductoMapper.toDto(producto(sinRelacion)).presentacion).toEqual({
      envase: { id: 1, denominacion: '' },
      contenido: { cantidad: 1.5, unidad: 'L' },
      texto: '1.5 L',
    });
  });

  it('toEntityFromCreateDto no copia presentacion a la entidad ni toca las columnas', () => {
    const entidad = ProductoMapper.toEntityFromCreateDto(
      {
        denominacion: 'aceite girasol natura',
        costo: 100,
        utilizaStockMinimo: false,
        utilizaPack: false,
        lineaId: 1,
        marcaId: 1,
        alicuotaIva: 21,
        usuarioCreatedId: 1,
        presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
      } as CreateProductoDto,
      linea,
      marca,
      usuario,
    );

    expect(entidad).not.toHaveProperty('presentacion');
    expect(columnasPresentacion(entidad)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('applyUpdate no copia presentacion a la entidad ni toca las columnas', () => {
    const entidad = producto(botella1500);

    ProductoMapper.applyUpdate(
      entidad,
      {
        denominacion: 'aceite girasol natura',
        usuarioUpdatedId: 1,
        presentacion: { envaseId: 2, cantidad: 1, unidad: 'kg' },
      } as UpdateProductoDto,
      linea,
      marca,
      usuario,
    );

    expect(entidad).not.toHaveProperty('presentacion');
    expect(columnasPresentacion(entidad)).toEqual([1, 'VOLUMEN', 1500]);
  });
});

import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { AuditoriaMapper } from './auditoria.mapper';

const producto = (datos: Partial<Producto>) =>
  Object.assign(new Producto(), {
    id: 1,
    denominacion: 'ACEITE GIRASOL 1.5L',
    createdAt: new Date(2026, 8, 23, 1, 40),
    updatedAt: new Date(2026, 8, 24, 0, 5),
    ...datos,
  });

describe('AuditoriaMapper.mapProductoToDto', () => {
  it('expone quién creó, modificó y eliminó el producto, con sus fechas', () => {
    const dto = AuditoriaMapper.mapProductoToDto(
      producto({
        deletedAt: new Date(2026, 8, 25, 10, 30),
        usuarioCreated: { denominacion: 'Admin' } as Producto['usuarioCreated'],
        usuarioUpdated: { denominacion: 'Jenifer Lopez' } as Producto['usuarioUpdated'],
        usuarioDeleted: { denominacion: 'Thomas Perez' } as Producto['usuarioDeleted'],
      }),
    );

    expect(dto).toEqual({
      id: 1,
      detalle: 'Producto ACEITE GIRASOL 1.5L',
      createdAt: '23/09/2026 01:40',
      updatedAt: '24/09/2026 00:05',
      deletedAt: '25/09/2026 10:30',
      usuarioCreated: 'Admin',
      usuarioUpdated: 'Jenifer Lopez',
      usuarioDeleted: 'Thomas Perez',
    });
  });

  it('deja vacíos los usuarios y la baja que no existen, sin romper', () => {
    const dto = AuditoriaMapper.mapProductoToDto(producto({}));

    expect(dto).toMatchObject({
      deletedAt: '',
      usuarioCreated: '',
      usuarioUpdated: '',
      usuarioDeleted: '',
    });
  });
});

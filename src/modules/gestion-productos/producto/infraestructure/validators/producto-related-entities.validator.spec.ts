import { NotFoundException } from '@nestjs/common';
import { ProductoRelatedEntitiesValidator } from './producto-related-entities.validator';

describe('ProductoRelatedEntitiesValidator', () => {
  const marcaService = { findEntityById: jest.fn() };
  const lineaService = { findEntityById: jest.fn() };
  const envaseService = { findEntityById: jest.fn() };
  let validator: ProductoRelatedEntitiesValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new ProductoRelatedEntitiesValidator(
      marcaService as any,
      lineaService as any,
      envaseService as any,
    );
  });

  it('resuelve Marca y Línea en paralelo', async () => {
    const marca = { id: 1, denominacion: 'NATURA' };
    const linea = { id: 2, denominacion: 'ACEITES' };
    marcaService.findEntityById.mockResolvedValue(marca);
    lineaService.findEntityById.mockResolvedValue(linea);

    await expect(validator.validarYObtenerEntidadesRelacionadas(1, 2)).resolves.toEqual({
      marca,
      linea,
    });
    expect(marcaService.findEntityById).toHaveBeenCalledWith(1);
    expect(lineaService.findEntityById).toHaveBeenCalledWith(2);
  });

  it('rechaza una Marca inexistente', async () => {
    marcaService.findEntityById.mockResolvedValue(null);
    lineaService.findEntityById.mockResolvedValue({ id: 2 });

    await expect(validator.validarYObtenerEntidadesRelacionadas(9, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rechaza una Línea inexistente', async () => {
    marcaService.findEntityById.mockResolvedValue({ id: 1 });
    lineaService.findEntityById.mockResolvedValue(null);

    await expect(validator.validarYObtenerEntidadesRelacionadas(1, 9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delega la validación y recuperación del envase', async () => {
    const envase = { id: 3, denominacion: 'BOTELLA' };
    envaseService.findEntityById.mockResolvedValue(envase);

    await expect(validator.validarYObtenerEnvasePresentacion(3)).resolves.toBe(envase);
    expect(envaseService.findEntityById).toHaveBeenCalledWith(3);
  });
});

import { ConflictException } from '@nestjs/common';
import { ProductoUniquenessValidator } from './producto-uniqueness.validator';

describe('ProductoUniquenessValidator', () => {
  const repository = {
    existsByDenominacion: jest.fn(),
    existsByCodigoProveedor: jest.fn(),
  };
  let validator: ProductoUniquenessValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new ProductoUniquenessValidator(repository as any);
  });

  it('acepta una denominación disponible y conserva el ID excluido', async () => {
    repository.existsByDenominacion.mockResolvedValue(false);

    await expect(validator.validarDenominacionUnica('LECHE', 4)).resolves.toBeUndefined();
    expect(repository.existsByDenominacion).toHaveBeenCalledWith('LECHE', 4);
  });

  it('rechaza una denominación duplicada', async () => {
    repository.existsByDenominacion.mockResolvedValue(true);

    await expect(validator.validarDenominacionUnica('LECHE')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('acepta un código de proveedor disponible', async () => {
    repository.existsByCodigoProveedor.mockResolvedValue(false);

    await expect(validator.validarCodigoProveedorUnico('PROV-1', 4)).resolves.toBeUndefined();
    expect(repository.existsByCodigoProveedor).toHaveBeenCalledWith('PROV-1', 4);
  });

  it('rechaza un código de proveedor duplicado', async () => {
    repository.existsByCodigoProveedor.mockResolvedValue(true);

    await expect(validator.validarCodigoProveedorUnico('PROV-1', 4)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

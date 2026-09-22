import { Inject, Injectable } from '@nestjs/common';
import { IProductoRepository } from '../../../producto/domain/interfaces/producto.repository-interface';

@Injectable()
export class PoliticaEliminacionEnvasePresentacion {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async tieneProductosActivos(envasePresentacionId: number): Promise<boolean> {
    return this.productoRepository.existsProductosActivosByEnvasePresentacion(
      envasePresentacionId,
    );
  }
}

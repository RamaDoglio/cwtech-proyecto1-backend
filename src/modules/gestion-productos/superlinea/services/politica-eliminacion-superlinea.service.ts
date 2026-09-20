import { Inject, Injectable } from '@nestjs/common';
import { ILineaRepository } from '../../../gestion-productos/linea/domain/interfaces/linea.repository.interface';

@Injectable()
export class PoliticaEliminacionSuperLinea {
  constructor(
    @Inject('ILineaRepository')
    private readonly lineaRepository: ILineaRepository,
  ) {}

  async reasignarLineas(
    superlineaOrigenId: number,
    superlineaDestinoId: number,
  ): Promise<number> {
    return this.lineaRepository.reassignSuperlinea(
      superlineaOrigenId,
      superlineaDestinoId,
    );
  }
}
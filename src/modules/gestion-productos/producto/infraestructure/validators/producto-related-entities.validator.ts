// infrastructure/validators/producto-related-entities.validator.ts
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarcaService } from '../../../marca/application/services/marca.service';
import { LineaService } from '../../../linea/application/services/linea.service';
import { EnvasePresentacionService } from '../../../envase-presentacion/application/services/envase-presentacion.service';
import { EnvasePresentacion } from '../../../envase-presentacion/domain/entities/envase-presentacion.entity';

@Injectable()
export class ProductoRelatedEntitiesValidator {
  constructor(
    private readonly marcaService: MarcaService,
    private readonly lineaService: LineaService,
    @Inject(forwardRef(() => EnvasePresentacionService))
    private readonly envasePresentacionService: EnvasePresentacionService,
  ) {}

  /**
   * Valida que el envase de la presentación exista y esté activo
   * (404 si no) y lo retorna para asignarlo al producto.
   */
  async validarYObtenerEnvasePresentacion(
    envasePresentacionId: number,
  ): Promise<EnvasePresentacion> {
    return this.envasePresentacionService.findEntityById(envasePresentacionId);
  }

  /**
   * Valida que todas las entidades relacionadas existan en la DB
   * y las retorna para su uso posterior
   */
  async validarYObtenerEntidadesRelacionadas(
    marcaId: number,
    lineaId: number,

  ) {
    let marca, linea;


      // Sin sublínea
      [marca, linea] = await Promise.all([
        this.marcaService.findEntityById(marcaId),
        this.lineaService.findEntityById(lineaId),

      ]);
  
    // Validar que existen
    this.validarEntidadExiste(marca, 'Marca', marcaId);
    this.validarEntidadExiste(linea, 'Línea', lineaId);

    return { marca, linea };
  }

  private validarEntidadExiste(
    entidad: any,
    tipo: string,
    id: number,
  ): void {
    if (!entidad) {
      throw new NotFoundException(`${tipo} con ID ${id} no encontrada`);
    }
  }
}
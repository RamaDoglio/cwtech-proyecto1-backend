import { Medida, UnidadMedida } from './medida.vo';

// ============================================================
// Presentacion — cómo se presenta un producto (CR-002): un envase y su
// contenido, por ejemplo "BOTELLA 500 ml". Las reglas del contenido son las
// de PA-023 (R1 a R4, en Medida). El envase es un catálogo que cargan los
// usuarios (EnvasePresentacion): el Value Object lo referencia por id y el
// servicio valida que exista.
// ============================================================

export interface DatosPresentacion {
  envaseId: number;
  cantidad: number;
  unidad: string;
}

export interface PresentacionPersistida {
  envasePresentacionId: number | null;
  presentacionDimension: string | null;
  presentacionMagnitudBase: number | null;
}

export interface EnvaseReferencia {
  id: number;
  denominacion: string;
}

export interface PresentacionRespuesta {
  envase: EnvaseReferencia;
  contenido: { cantidad: number; unidad: UnidadMedida };
  texto: string;
}

export class Presentacion {
  private constructor(
    readonly envaseId: number,
    readonly contenido: Medida,
  ) {}

  // El envase, el valor y la unidad son obligatorios. El DTO garantiza los
  // tipos; acá se validan las reglas del contenido.
  static crear(datos: DatosPresentacion): Presentacion {
    Presentacion.validarEnvaseId(datos.envaseId);
    return new Presentacion(
      datos.envaseId,
      Medida.crear(datos.cantidad, datos.unidad),
    );
  }

  // Reconstruye desde las columnas de `producto`. Las tres en null significan
  // que el producto no tiene presentación (productos anteriores a CR-002).
  static desdePersistencia(
    columnas: PresentacionPersistida,
  ): Presentacion | null {
    const {
      envasePresentacionId: envaseId,
      presentacionDimension: dimension,
      presentacionMagnitudBase: magnitudBase,
    } = columnas;

    if (envaseId == null && dimension == null && magnitudBase == null) {
      return null;
    }

    if (envaseId == null || dimension == null || magnitudBase == null) {
      throw new Error(
        'Presentación persistida inválida: el envase, la dimensión y la magnitud tienen que venir juntos.',
      );
    }

    Presentacion.validarEnvaseId(envaseId);
    return new Presentacion(
      envaseId,
      Medida.desdePersistencia(dimension, magnitudBase),
    );
  }

  // `<envase> <medida>`, por ejemplo "BOTELLA 500 ml".
  texto(denominacionEnvase: string): string {
    return [denominacionEnvase.trim(), this.contenido.texto()]
      .filter((parte) => parte.length > 0)
      .join(' ');
  }

  equals(otra: Presentacion): boolean {
    return (
      this.envaseId === otra.envaseId && this.contenido.equals(otra.contenido)
    );
  }

  aPersistencia(): PresentacionPersistida {
    return {
      envasePresentacionId: this.envaseId,
      presentacionDimension: this.contenido.dimension,
      presentacionMagnitudBase: this.contenido.magnitudBase,
    };
  }

  aRespuesta(envase: EnvaseReferencia): PresentacionRespuesta {
    return {
      envase: { id: envase.id, denominacion: envase.denominacion },
      contenido: this.contenido.aCantidadYUnidad(),
      texto: this.texto(envase.denominacion),
    };
  }

  // Defensa: el DTO ya exige un entero positivo. Un id inválido acá es un
  // error de programación o un dato corrupto, no un error del usuario.
  private static validarEnvaseId(envaseId: number): void {
    if (!Number.isInteger(envaseId) || envaseId < 1) {
      throw new Error(`Id de envase de presentación inválido: ${envaseId}.`);
    }
  }
}

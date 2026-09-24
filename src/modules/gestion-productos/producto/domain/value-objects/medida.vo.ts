import { PresentacionInvalidaException } from '../../../../common/exceptions/presentacion-invalida.exception';

// ============================================================
// Medida — contenido de una presentación (CR-002; reglas en PA-023).
// La magnitud se guarda como entero en la unidad base de su dimensión:
// ml, g o piezas (N1).
// ============================================================

export enum DimensionMedida {
  VOLUMEN = 'VOLUMEN',
  MASA = 'MASA',
  UNIDADES = 'UNIDADES',
}

export type UnidadMedida = 'ml' | 'L' | 'g' | 'kg' | 'unidades';

interface DefinicionUnidad {
  dimension: DimensionMedida;
  factorABase: number;
  admiteDecimales: boolean;
  mensajeDecimales: string;
}

// R3: ml, g y unidades van sin decimales; L y kg admiten hasta 2.
const UNIDADES: Record<UnidadMedida, DefinicionUnidad> = {
  ml: {
    dimension: DimensionMedida.VOLUMEN,
    factorABase: 1,
    admiteDecimales: false,
    mensajeDecimales: 'Los ml no admiten decimales.',
  },
  L: {
    dimension: DimensionMedida.VOLUMEN,
    factorABase: 1000,
    admiteDecimales: true,
    mensajeDecimales: 'Los L admiten hasta 2 decimales.',
  },
  g: {
    dimension: DimensionMedida.MASA,
    factorABase: 1,
    admiteDecimales: false,
    mensajeDecimales: 'Los g no admiten decimales.',
  },
  kg: {
    dimension: DimensionMedida.MASA,
    factorABase: 1000,
    admiteDecimales: true,
    mensajeDecimales: 'Los kg admiten hasta 2 decimales.',
  },
  unidades: {
    dimension: DimensionMedida.UNIDADES,
    factorABase: 1,
    admiteDecimales: false,
    mensajeDecimales: 'Las unidades no admiten decimales.',
  },
};

// R2: la unidad se reconoce sin distinguir mayúsculas. Sin alias (A5).
const UNIDADES_POR_TEXTO = new Map<string, UnidadMedida>([
  ['ml', 'ml'],
  ['l', 'L'],
  ['g', 'g'],
  ['kg', 'kg'],
  ['unidades', 'unidades'],
]);

// R4: máximos por dimensión, en unidad base.
const MAXIMOS: Record<
  DimensionMedida,
  { magnitudBase: number; mensaje: string }
> = {
  [DimensionMedida.VOLUMEN]: {
    magnitudBase: 1_000_000,
    mensaje: 'La presentación no puede superar 1000 L.',
  },
  [DimensionMedida.MASA]: {
    magnitudBase: 1_000_000,
    mensaje: 'La presentación no puede superar 1000 kg.',
  },
  [DimensionMedida.UNIDADES]: {
    magnitudBase: 10_000,
    mensaje: 'La presentación no puede superar 10000 unidades.',
  },
};

const MENSAJE_CANTIDAD_INVALIDA =
  'La cantidad de la presentación debe ser mayor a 0.'; // R1
const MENSAJE_UNIDAD_NO_ADMITIDA =
  'Unidad no admitida. Usá ml, L, g, kg o unidades.'; // R2

// Tolerancia de punto flotante para contar decimales (1.15 * 100 = 114.99999999999999).
const TOLERANCIA_DECIMALES = 1e-9;

export class Medida {
  private constructor(
    readonly dimension: DimensionMedida,
    readonly magnitudBase: number,
  ) {}

  // Valida en el orden R2, R1, R3, R4 (aclaración A7 del plan de CR-002).
  static crear(cantidad: number, unidad: string): Medida {
    const unidadNormalizada = Medida.normalizarUnidad(unidad);
    if (!unidadNormalizada) {
      throw new PresentacionInvalidaException(MENSAJE_UNIDAD_NO_ADMITIDA);
    }

    if (
      typeof cantidad !== 'number' ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      throw new PresentacionInvalidaException(MENSAJE_CANTIDAD_INVALIDA);
    }

    const definicion = UNIDADES[unidadNormalizada];
    const decimalesValidos = definicion.admiteDecimales
      ? Medida.tieneHastaDosDecimales(cantidad)
      : Number.isInteger(cantidad);
    if (!decimalesValidos) {
      throw new PresentacionInvalidaException(definicion.mensajeDecimales);
    }

    const magnitudBase = Math.round(cantidad * definicion.factorABase);
    const maximo = MAXIMOS[definicion.dimension];
    if (magnitudBase > maximo.magnitudBase) {
      throw new PresentacionInvalidaException(maximo.mensaje);
    }

    return new Medida(definicion.dimension, magnitudBase);
  }

  // Reconstruye desde la base. Un valor inválido es un dato corrupto,
  // no un error del usuario: por eso lanza Error y no una excepción de dominio.
  static desdePersistencia(dimension: string, magnitudBase: number): Medida {
    if (!Medida.esDimension(dimension)) {
      throw new Error(
        `Presentación persistida inválida: dimensión desconocida "${dimension}".`,
      );
    }

    if (
      !Number.isInteger(magnitudBase) ||
      magnitudBase < 1 ||
      magnitudBase > MAXIMOS[dimension].magnitudBase
    ) {
      throw new Error(
        `Presentación persistida inválida: magnitud ${magnitudBase} fuera de rango para ${dimension}.`,
      );
    }

    return new Medida(dimension, magnitudBase);
  }

  // N2: volumen y masa desde 1000 y múltiplos de 10 se expresan en L o kg;
  // si no, en ml o g. Las unidades siempre se expresan en 'unidades'.
  aCantidadYUnidad(): { cantidad: number; unidad: UnidadMedida } {
    if (this.dimension === DimensionMedida.UNIDADES) {
      return { cantidad: this.magnitudBase, unidad: 'unidades' };
    }

    const [unidadBase, unidadMayor]: [UnidadMedida, UnidadMedida] =
      this.dimension === DimensionMedida.VOLUMEN ? ['ml', 'L'] : ['g', 'kg'];

    if (this.magnitudBase >= 1000 && this.magnitudBase % 10 === 0) {
      return {
        cantidad: Number((this.magnitudBase / 1000).toFixed(2)),
        unidad: unidadMayor,
      };
    }

    return { cantidad: this.magnitudBase, unidad: unidadBase };
  }

  texto(): string {
    const { cantidad, unidad } = this.aCantidadYUnidad();

    if (this.dimension === DimensionMedida.UNIDADES) {
      return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
    }

    return `${cantidad} ${unidad}`;
  }

  equals(otra: Medida): boolean {
    return (
      this.dimension === otra.dimension &&
      this.magnitudBase === otra.magnitudBase
    );
  }

  esUnaUnidad(): boolean {
    return (
      this.dimension === DimensionMedida.UNIDADES && this.magnitudBase === 1
    );
  }

  private static normalizarUnidad(unidad: string): UnidadMedida | null {
    if (typeof unidad !== 'string') {
      return null;
    }
    return UNIDADES_POR_TEXTO.get(unidad.toLowerCase()) ?? null;
  }

  private static tieneHastaDosDecimales(cantidad: number): boolean {
    const centesimos = cantidad * 100;
    return Math.abs(centesimos - Math.round(centesimos)) < TOLERANCIA_DECIMALES;
  }

  private static esDimension(valor: string): valor is DimensionMedida {
    return Object.values<string>(DimensionMedida).includes(valor);
  }
}

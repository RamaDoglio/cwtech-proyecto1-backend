import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { Marca } from '../../../marca/domain/entities/marca.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ProductoOperacion } from '../../../producto-operacion/entities/producto-operacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { MonetarioColumn } from 'src/modules/common/decorators/monetario-column.decorator';
import { CantidadColumn } from 'src/modules/common/decorators/cantidad-column.decorator';
import { PorcentajeColumn } from 'src/modules/common/decorators/porcentaje-column.decorator';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import {
  MovimientoStock,
  TipoMovimientoStock,
} from './movimiento-stock.entity';
import { HistorialPrecio } from './historial-precio.entity';
import { StockNegativoException } from '../../../../common/exceptions/stock-negativo.exception';
import { PresentacionRequeridaException } from '../../../../common/exceptions/presentacion-requerida.exception';
import { Presentacion } from '../value-objects/presentacion.vo';
import { EnvasePresentacion } from '../../../envase-presentacion/domain/entities/envase-presentacion.entity';

@Entity('producto')
export class Producto {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'text' })
  denominacion: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  codigoProveedor?: string | null;

  @Column({ type: 'text', nullable: true })
  codigoBarra?: string | null;

  // ========== PROVEEDOR ==========
  @ManyToOne(() => Proveedor, (pro) => pro.proveedoresOperacion, {
    eager: true,
  })
  @JoinColumn({ name: 'proveedor_id' })
  @Index()
  proveedor: Proveedor;

  /*
  Nota: No usar el enum alciculta iva en @Column
        sino no anda el importar precios 
  */
  @PorcentajeColumn(21.0)
  alicuotaIva: AlicuotaIva;

  // Stock: columna decimal por flexibilidad de infraestructura, pero por
  // decisión de negocio (PA-011) este stock siempre es entero, nunca
  // fraccionario. El DTO lo valida con @IsInt() a propósito.
  @CantidadColumn()
  stock: number;

  @Column('boolean', { default: false })
  utilizaStockMinimo: boolean;

  @Column('boolean', { default: false })
  utilizaStockMinimoPorEmpresa: boolean;

  @CantidadColumn()
  stockMinimo: number;

  @MonetarioColumn()
  costo?: number;

  @MonetarioColumn()
  costoDolar?: number;

  /*
  Ultima cotizacion dolar por el cambio de precio si producto posee costo dolar
  */
  @MonetarioColumn()
  cotizacionDolar?: number;
  //se utiliza en las importaciones;

  @MonetarioColumn()
  precioDolar?: number;
  // Precio de venta

  @MonetarioColumn()
  precio?: number;

  @PorcentajeColumn()
  porcentaje?: number;

  @Column({ type: 'timestamp', nullable: true })
  fechaCosto?: Date;

  @Column('boolean', { default: false })
  costoEnDolar?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaCostoDolar?: Date;

  @Column('boolean', { default: false })
  destacado?: boolean;

  @Column('boolean', { default: false })
  envioGratis?: boolean;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  deletedAt?: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_created_id' })
  usuarioCreated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_updated_id' })
  usuarioUpdated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_deleted_id' })
  usuarioDeleted: Usuario;

  // ========== LINEA ==========
  @ManyToOne(() => Linea, (linea) => linea.productos)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  // ==========  MARCA ==========
  @ManyToOne(() => Marca, (marca) => marca.productos)
  @JoinColumn({ name: 'marca_id' })
  marca: Marca;

  @Column({ default: false })
  utilizaPack: boolean;

  @Column({ type: 'int', nullable: true })
  cantidadPorPack: number | null;

  @Column({ type: 'text', nullable: true })
  imagen?: string;

  @Column({ type: 'text', nullable: true })
  ubicacion?: string;

  @OneToMany(() => ProductoOperacion, (po) => po.producto)
  productosOperacion: ProductoOperacion[];

  @Column({ type: 'int', default: 0 })
  sistema: number;

  @Column({ type: 'text', nullable: true })
  codigoReferencia?: string | null;

  // ========== PRESENTACIÓN (CR-002; reglas en PA-023) ==========
  // Value Object Presentacion (envase + contenido) persistido en tres
  // columnas. Las tres en null significan que el producto no tiene
  // presentación (anterior a CR-002). Las restricciones CHECK están en la
  // migración AgregarPresentacionProducto.
  // Una relación = una columna: envasePresentacionId y envasePresentacion
  // apuntan a la misma columna envase_presentacion_id.
  @Index('IDX_producto_envase_presentacion_id')
  @Column({ name: 'envase_presentacion_id', type: 'int', nullable: true })
  envasePresentacionId: number | null;

  @ManyToOne(() => EnvasePresentacion, { nullable: true })
  @JoinColumn({
    name: 'envase_presentacion_id',
    foreignKeyConstraintName: 'FK_producto_envase_presentacion',
  })
  envasePresentacion?: EnvasePresentacion | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  presentacionDimension: string | null;

  @Column({ type: 'int', nullable: true })
  presentacionMagnitudBase: number | null;

  // ========= Movimiento-Stock =============

  @OneToMany(() => MovimientoStock, (movimiento) => movimiento.producto, {
    eager: false,
  })
  movimientos: MovimientoStock[];

  // ========= Historial de Precios =============

  @OneToMany(() => HistorialPrecio, (historial) => historial.producto, {
    eager: false,
  })
  historialPrecios: HistorialPrecio[];

  // ============================================================
  // Ajuste de stock — invariante del agregado Producto
  // ============================================================
  ajustarStock(
    cantidad: number,
    tipo: TipoMovimientoStock,
    motivo?: string,
    usuarioId?: number,
  ): MovimientoStock {
    // Invariante 1: la cantidad no puede ser 0 (delegada a MovimientoStock.crear)
    // Invariante 2: ajuste manual requiere motivo (delegada a MovimientoStock.crear)

    const nuevoStock = this.stock + cantidad;

    // Invariante 3: el stock no puede quedar negativo
    if (nuevoStock < 0) {
      throw new StockNegativoException(nuevoStock);
    }

    const movimiento = MovimientoStock.crear(
      this.id,
      tipo,
      cantidad,
      motivo,
      usuarioId,
    );

    (this.movimientos ??= []).push(movimiento);

    this.stock = nuevoStock;

    return movimiento;
  }

  // ============================================================
  // Estado de alerta por stock bajo — regla de negocio del dominio
  // Si stockActual <= stockMinimo y la regla está habilitada, el producto
  // entra en alerta. La reacción ante la alerta (notificar, listar, etc.)
  // no corresponde a esta entidad; queda en la capa de aplicación.
  // ============================================================
  estaBajoMinimo(): boolean {
    if (!this.utilizaStockMinimo) {
      return false;
    }

    return this.stock <= this.stockMinimo;
  }

  // ============================================================
  // Cambio de precio — invariante del agregado Producto
  // ============================================================
  cambiarPrecio(
    precioNuevo: number,
    motivo: string,
    usuarioId?: number,
  ): HistorialPrecio {
    const precioAnterior = this.precio ?? 0;

    // Invariantes "precio nuevo > 0" y "motivo obligatorio" delegadas a
    // HistorialPrecio.crear().
    const historial = HistorialPrecio.crear(
      this.id,
      precioAnterior,
      precioNuevo,
      motivo,
      usuarioId,
    );

    (this.historialPrecios ??= []).push(historial);

    this.precio = precioNuevo;

    return historial;
  }

  // ============================================================
  // Presentación — invariante del agregado Producto (PA-023 §5)
  // ============================================================
  obtenerPresentacion(): Presentacion | null {
    return Presentacion.desdePersistencia({
      envasePresentacionId: this.envasePresentacionId ?? null,
      presentacionDimension: this.presentacionDimension ?? null,
      presentacionMagnitudBase: this.presentacionMagnitudBase ?? null,
    });
  }

  // `envase` es el envase ya validado por el servicio (existe y está activo).
  // Se asignan la columna y la relación juntas para que TypeORM no guarde un
  // envase viejo que haya quedado cargado en la relación.
  // No modifica `denominacion`: la denominación automática está fuera del
  // alcance de CR-002 (aclaración A3 del plan).
  asignarPresentacion(
    presentacion: Presentacion | null,
    envase?: EnvasePresentacion,
  ): void {
    if (presentacion === null) {
      // Invariante: una presentación cargada no se puede quitar. Los productos
      // anteriores a CR-002 siguen sin presentación hasta que se les cargue una.
      if (this.tienePresentacion()) {
        throw new PresentacionRequeridaException();
      }
      return;
    }

    if (!envase || envase.id !== presentacion.envaseId) {
      throw new Error('El envase indicado no corresponde al de la presentación.');
    }

    const columnas = presentacion.aPersistencia();
    this.envasePresentacionId = columnas.envasePresentacionId;
    this.envasePresentacion = envase;
    this.presentacionDimension = columnas.presentacionDimension;
    this.presentacionMagnitudBase = columnas.presentacionMagnitudBase;
  }

  private tienePresentacion(): boolean {
    return (
      this.envasePresentacionId != null ||
      this.presentacionDimension != null ||
      this.presentacionMagnitudBase != null
    );
  }

  // ============================================================
  // Denominación automática — sólo al alta (CR-005). "Marca + Línea +
  // Presentación", con el envase incluido (ej. "COCA-COLA GASEOSAS BOTELLA
  // 500 ml"): sin el envase, "Coca-Cola Gaseosas 500 ml" en botella y en
  // lata generarían el mismo string y, como la denominación es única en
  // todo el sistema, la segunda alta fallaría por una colisión que no es
  // un duplicado real. No se usa en update: una edición posterior de
  // marca, línea o presentación no regenera la denominación existente.
  // ============================================================
  static generarDenominacionAutomatica(
    marcaDenominacion: string,
    lineaDenominacion: string,
    presentacionTexto: string,
  ): string {
    return [marcaDenominacion, lineaDenominacion, presentacionTexto]
      .map((parte) => parte.trim())
      .filter((parte) => parte.length > 0)
      .join(' ');
  }
}

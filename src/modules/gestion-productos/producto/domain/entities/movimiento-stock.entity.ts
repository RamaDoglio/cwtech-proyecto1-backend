// domain/entities/movimiento-stock.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { CantidadInvalidaException } from '../../../../common/exceptions/cantidad-invalida.exception';

export enum TipoMovimientoStock {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
  AJUSTE_MANUAL = 'AJUSTE_MANUAL',
  AJUSTE_AUTOMATICO = 'AJUSTE_AUTOMATICO',
}

@Entity('movimiento_stock')
export class MovimientoStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Producto, (producto) => producto.movimientos, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ name: 'producto_id' })
  @Index()
  productoId: number;

  @Column({
    type: 'enum',
    enum: TipoMovimientoStock,
  })
  tipo: TipoMovimientoStock;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  motivo?: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ name: 'usuario_id', nullable: true })
  @Index()
  usuarioId?: number;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  // ============================================================
  // Factory method — la única forma válida de crear un movimiento.
  // TypeORM puede instanciar la clase sin argumentos para hidratar
  // desde la DB (por eso NO hay constructor explícito).
  // ============================================================
  static crear(
    productoId: number,
    tipo: TipoMovimientoStock,
    cantidad: number,
    motivo?: string,
    usuarioId?: number,
  ): MovimientoStock {
    // Invariante 1: la cantidad no puede ser 0
    if (cantidad === 0) {
      throw new CantidadInvalidaException(cantidad);
    }

    // Invariante 2: ajuste manual SIEMPRE requiere motivo
    if (tipo === TipoMovimientoStock.AJUSTE_MANUAL && !motivo) {
      throw new MotivoRequeridoException();
    }

    const movimiento = new MovimientoStock();
    movimiento.productoId = productoId;
    movimiento.tipo = tipo;
    movimiento.cantidad = cantidad;
    movimiento.motivo = motivo;
    movimiento.usuarioId = usuarioId;

    return movimiento;
  }
}
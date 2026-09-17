// domain/entities/historial-precio.entity.ts
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
import { MonetarioColumn } from 'src/modules/common/decorators/monetario-column.decorator';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { PrecioInvalidoException } from '../../../../common/exceptions/precio-invalido.exception';

@Entity('historial_precio')
export class HistorialPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Producto, (producto) => producto.historialPrecios, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ name: 'producto_id' })
  @Index()
  productoId: number;

  @MonetarioColumn()
  precioAnterior: number;

  @MonetarioColumn()
  precioNuevo: number;

  @Column({ type: 'text' })
  motivo: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ name: 'usuario_id', nullable: true })
  @Index()
  usuarioId?: number;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  // ============================================================
  // Factory method — la única forma válida de crear un registro de
  // historial. TypeORM puede instanciar la clase sin argumentos para
  // hidratar desde la DB (por eso NO hay constructor explícito).
  // ============================================================
  static crear(
    productoId: number,
    precioAnterior: number,
    precioNuevo: number,
    motivo: string,
    usuarioId?: number,
  ): HistorialPrecio {
    // Invariante 1: el precio nuevo debe ser > 0
    if (!(precioNuevo > 0)) {
      throw new PrecioInvalidoException(precioNuevo);
    }

    // Invariante 2: el motivo siempre es obligatorio en este flujo
    if (!motivo || !motivo.trim()) {
      throw new MotivoRequeridoException('El cambio de precio requiere un motivo');
    }

    const historial = new HistorialPrecio();
    historial.productoId = productoId;
    historial.precioAnterior = precioAnterior;
    historial.precioNuevo = precioNuevo;
    historial.motivo = motivo;
    historial.usuarioId = usuarioId;

    return historial;
  }
}

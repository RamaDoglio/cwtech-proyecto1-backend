import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, RelationId,} from 'typeorm';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { TipoAumento } from '../../../../common/enums/tipo-aumento.emun';
import { AlcanceAjustePrecio } from '../../enums/alcance-ajuste-precio.enum';

@Entity('cambio_precios_masivo_historial')
export class CambioPreciosMasivoHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tipo: TipoAumento;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  valor: number;

  @Column({ type: 'enum', enum: AlcanceAjustePrecio })
  alcance: AlcanceAjustePrecio;

  @Column({ type: 'int', nullable: true })
  lineaId?: number;

  @Column({ type: 'int' })
  cantidadProductosAfectados: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @RelationId((historial: CambioPreciosMasivoHistorial) => historial.usuario)
  usuarioId: number;

  @CreateDateColumn()
  fecha: Date;
}
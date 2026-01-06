import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { OrderItemOrmEntity } from "./order-item.orm-entity";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

@Entity("orders")
export class OrderOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "session_id" })
  sessionId: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column("decimal", { precision: 10, scale: 2, name: "total_value" })
  totalValue: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relacionamento: Uma Order tem Muitos Itens
  // cascade: true -> Ao salvar a Order, salva os Items automaticamente
  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, { cascade: true })
  items: OrderItemOrmEntity[];
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OrderOrmEntity } from "./order.orm-entity";

@Entity("order_items")
export class OrderItemOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  sku: string;

  @Column("int")
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  // Relacionamento: Muitos Itens pertencem a Uma Order
  @ManyToOne(() => OrderOrmEntity, (order) => order.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order: OrderOrmEntity;
}

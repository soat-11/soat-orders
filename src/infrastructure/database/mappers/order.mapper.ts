import { Order } from "@core/domain/entities/order.entity";
import { OrderItem } from "@core/domain/entities/order-item.entity";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { OrderItemOrmEntity } from "../entities/order-item.orm-entity";

export class OrderMapper {
  static toPersistence(domain: Order): OrderOrmEntity {
    const entity = new OrderOrmEntity();
    entity.id = domain.id as string;
    entity.sessionId = domain.sessionId;
    entity.status = domain.status;
    entity.totalValue = domain.totalValue;
    entity.createdAt = domain.createdAt as Date;

    // Mapeia os itens do domínio para itens do TypeORM
    entity.items = domain.items.map((item) => {
      const itemEntity = new OrderItemOrmEntity();
      itemEntity.sku = item.sku;
      itemEntity.quantity = item.quantity;
      itemEntity.price = item.price;
      return itemEntity;
    });

    return entity;
  }

  static toDomain(entity: OrderOrmEntity): Order {
    const items = entity.items.map(
      (i) => new OrderItem(i.sku, i.quantity, Number(i.price))
    );

    return new Order(
      entity.sessionId,
      items,
      Number(entity.totalValue),
      entity.status,
      entity.id,
      entity.createdAt
    );
  }
}

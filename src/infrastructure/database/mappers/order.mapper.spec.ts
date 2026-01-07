import { OrderMapper } from "./order.mapper";
import { Order } from "@core/domain/entities/order.entity";
import { OrderStatus } from "@core/domain/enum/order-status.enum";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { OrderItem } from "@core/domain/entities/order-item.entity";

describe("OrderMapper", () => {
  const date = new Date();

  it("deve converter de Domínio para Persistência (toPersistence)", () => {
    // Setup
    const item = new OrderItem("A", 1, 10);
    const domain = new Order(
      "session-1",
      [item],
      10,
      OrderStatus.RECEIVED,
      "123",
      date
    );

    const persistence = OrderMapper.toPersistence(domain);

    expect(persistence).toBeInstanceOf(OrderOrmEntity);
    expect(persistence.id).toBe("123");
    expect(persistence.status).toBe(OrderStatus.RECEIVED);
    expect(persistence.items.length).toBe(1);
    expect(persistence.items[0].sku).toBe("A");
  });

  it("deve converter de Persistência para Domínio (toDomain)", () => {
    const entity = new OrderOrmEntity();
    entity.id = "123";
    entity.sessionId = "session-1";
    entity.status = OrderStatus.READY;
    entity.totalValue = 50;
    entity.createdAt = date;
    entity.items = [{ sku: "B", quantity: 2, price: 25 } as any];

    const domain = OrderMapper.toDomain(entity);

    expect(domain).toBeInstanceOf(Order);
    expect(domain.id).toBe("123");
    expect(domain.status).toBe(OrderStatus.READY);
    expect(domain.items.length).toBe(1);
    expect(domain.items[0].price).toBe(25);
  });
});

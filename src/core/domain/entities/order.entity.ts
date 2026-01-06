import { OrderStatus } from "../enum/order-status.enum";
import { OrderItem } from "./order-item.entity";

export class Order {
  constructor(
    public readonly sessionId: string,
    public readonly items: OrderItem[],
    public readonly totalValue: number,
    public status: OrderStatus = OrderStatus.RECEIVED,
    public readonly id?: string,
    public readonly createdAt?: Date
  ) {}

  static create(
    sessionId: string,
    items: OrderItem[],
    totalValue: number
  ): Order {
    if (!items || items.length === 0) {
      throw new Error("O pedido deve conter pelo menos um item.");
    }

    return new Order(sessionId, items, totalValue, OrderStatus.RECEIVED);
  }
}

import { OrderStatus } from "../enum/order-status.enum";
import { OrderItem } from "./order-item.entity";

export class Order {
  constructor(
    public readonly sessionId: string,
    public readonly items: OrderItem[],
    public readonly totalValue: number,
    public status: OrderStatus = OrderStatus.RECEIVED,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
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

  public changeStatus(newStatus: OrderStatus): void {
    if (this.status === newStatus) {
      return;
    }

    if (this.status === OrderStatus.COMPLETED) {
      throw new Error("O pedido já foi finalizado e não pode ser alterado.");
    }

    if (this.status === OrderStatus.CANCELLED) {
      throw new Error("O pedido está cancelado e não pode ser alterado.");
    }

    if (
      this.status === OrderStatus.READY &&
      newStatus === OrderStatus.IN_PREPARATION
    ) {
      throw new Error(
        "O pedido já está pronto, não pode voltar para preparação."
      );
    }

    this.status = newStatus;
  }
}

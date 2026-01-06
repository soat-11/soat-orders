import { Order } from "../entities/order.entity";

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
}

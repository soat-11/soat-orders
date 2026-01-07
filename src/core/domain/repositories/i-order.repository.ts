import { Order } from "../entities/order.entity";
import { OrderStatus } from "../enum/order-status.enum";

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findManyByStatus(statuses: OrderStatus[]): Promise<Order[]>;
}

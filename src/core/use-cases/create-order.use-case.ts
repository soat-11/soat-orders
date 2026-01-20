import { Inject, Injectable } from "@nestjs/common";
import { Order } from "@domain/entities/order.entity";
import { OrderItem } from "@domain/entities/order-item.entity";
import { IOrderRepository } from "@domain/repositories/i-order.repository";
import { IEventPublisher } from "@domain/events/i-event-publisher";
import { CreateOrderInputDto } from "@infra/http/dto/create-order.input";
import { CreateOrderOutputDto } from "@infra/http/dto/create-order.output";
import { Result } from "@shared/result";

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject("IOrderRepository")
    private readonly orderRepository: IOrderRepository,
    @Inject("IEventPublisher") private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    sessionId: string,
    input: CreateOrderInputDto,
  ): Promise<Result<CreateOrderOutputDto>> {
    try {
      const items = input.items.map(
        (i) => new OrderItem(i.sku, i.quantity, i.unitPrice),
      );

      const newOrder = Order.create(sessionId, items, input.totalValue);
      const savedOrder = await this.orderRepository.create(newOrder);

      await this.eventPublisher.publish("order.created", {
        sessionId: savedOrder.sessionId,
        idempotencyKey: savedOrder.id,
      });

      const output = new CreateOrderOutputDto(
        savedOrder.id!,
        savedOrder.sessionId,
        savedOrder.status,
        savedOrder.createdAt!,
      );

      return Result.ok(output);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : "Erro desconhecido",
      );
    }
  }
}

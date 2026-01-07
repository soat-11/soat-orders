import { Inject, Injectable } from "@nestjs/common";
import { IOrderRepository } from "@core/domain/repositories/i-order.repository";
import { OrderStatus } from "@core/domain/enum/order-status.enum";
import { Result } from "@shared/result";

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject("IOrderRepository")
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<Result<void>> {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return Result.fail("Pedido não encontrado.");
      }

      order.changeStatus(newStatus);

      await this.orderRepository.create(order);

      return Result.ok();
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : "Erro ao atualizar status."
      );
    }
  }
}

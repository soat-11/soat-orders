import { Inject, Injectable } from "@nestjs/common";
import { IOrderRepository } from "@core/domain/repositories/i-order.repository";
import { GetOrderOutputDto } from "@infra/http/dto/get-order.output";
import { Result } from "@shared/result";

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject("IOrderRepository")
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(orderId: string): Promise<Result<GetOrderOutputDto>> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      return Result.fail("Pedido não encontrado");
    }

    const dto = GetOrderOutputDto.fromDomain(order);

    return Result.ok(dto);
  }
}

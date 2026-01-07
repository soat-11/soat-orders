import { Inject, Injectable } from "@nestjs/common";
import { OrderStatus } from "@core/domain/enum/order-status.enum";
import { IOrderRepository } from "@core/domain/repositories/i-order.repository";
import { ListOrderOutputDto } from "@infra/http/dto/list-order.output";
import { Result } from "@shared/result";
import { Order } from "@core/domain/entities/order.entity";

@Injectable()
export class ListActiveOrdersUseCase {
  constructor(
    @Inject("IOrderRepository")
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(): Promise<Result<ListOrderOutputDto[]>> {
    try {
      const activeStatuses = [
        OrderStatus.READY,
        OrderStatus.IN_PREPARATION,
        OrderStatus.RECEIVED,
      ];

      const orders = await this.orderRepository.findManyByStatus(
        activeStatuses
      );

      // Ordena conforme a Regra de Negócio (Pronto > Em Prep > Recebido)
      // Se empatar no status, usa a data (o banco já trouxe ordenado por data, o sort estável mantém)
      const sortedOrders = this.sortByStatusPriority(orders);

      // 4. Mapeia para DTO calculando o tempo
      const output = sortedOrders.map((order) => {
        const waitingTime = this.calculateWaitingTime(order.createdAt!);

        return new ListOrderOutputDto(
          order.id!,
          order.status,
          order.createdAt!,
          waitingTime
        );
      });

      return Result.ok(output);
    } catch (error) {
      return Result.fail("Erro ao listar pedidos ativos.");
    }
  }

  private sortByStatusPriority(orders: Order[]): Order[] {
    const priorityMap = {
      [OrderStatus.READY]: 1,
      [OrderStatus.IN_PREPARATION]: 2,
      [OrderStatus.RECEIVED]: 3,
      // Outros status ficariam com prioridade baixa se viessem
      [OrderStatus.COMPLETED]: 9,
      [OrderStatus.CANCELLED]: 9,
    };

    return orders.sort((a, b) => {
      const priorityA = priorityMap[a.status] || 99;
      const priorityB = priorityMap[b.status] || 99;
      return priorityA - priorityB;
    });
  }

  private calculateWaitingTime(createdAt: Date): string {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diffSeconds = Math.floor((now - created) / 1000);

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
}

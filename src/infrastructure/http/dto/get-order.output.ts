import { ApiProperty } from "@nestjs/swagger";
import { Order } from "@core/domain/entities/order.entity";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

export class OrderItemOutputDto {
  @ApiProperty({ example: "HAMBURGER-01" })
  sku: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 25.5 })
  price: number;
}

export class GetOrderOutputDto {
  @ApiProperty({ example: "22b743f8-e831-49c2-b466-e6d60761513e" })
  orderId: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PREPARATION })
  status: OrderStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [OrderItemOutputDto] })
  items: OrderItemOutputDto[];

  @ApiProperty({ description: "Total de itens únicos", example: 1 })
  quantityItems: number;

  @ApiProperty({ description: "Valor total do pedido", example: 51.0 })
  total: number;

  static fromDomain(order: Order): GetOrderOutputDto {
    const dto = new GetOrderOutputDto();

    dto.orderId = order.id!;
    dto.status = order.status;
    dto.createdAt = order.createdAt!;
    dto.total = order.totalValue;

    dto.items = order.items.map((item) => {
      const itemDto = new OrderItemOutputDto();
      itemDto.sku = item.sku;
      itemDto.quantity = item.quantity;
      itemDto.price = item.price;
      return itemDto;
    });

    dto.quantityItems = dto.items.length;

    return dto;
  }
}

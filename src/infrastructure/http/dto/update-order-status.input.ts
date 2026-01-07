import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

export class UpdateOrderStatusInputDto {
  @ApiProperty({
    enum: OrderStatus,
    description: "Novo status do pedido",
    example: OrderStatus.IN_PREPARATION,
  })
  @IsEnum(OrderStatus, { message: "Status inválido fornecido." })
  @IsNotEmpty()
  status: OrderStatus;
}

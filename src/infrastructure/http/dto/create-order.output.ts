import { OrderStatus } from "@core/domain/enum/order-status.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderOutputDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  orderId: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.RECEIVED })
  status: OrderStatus;

  @ApiProperty()
  createdAt: Date;

  constructor(orderId: string, status: OrderStatus, createdAt: Date) {
    this.orderId = orderId;
    this.status = status;
    this.createdAt = createdAt;
  }
}

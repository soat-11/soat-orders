import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

export class ListOrderOutputDto {
  @ApiProperty({
    description: "ID único do pedido",
    example: "22222222-2222-2222-2222-222222222222",
  })
  id: string;

  @ApiProperty({
    description: "Status atual do pedido",
    enum: OrderStatus,
    example: OrderStatus.READY,
  })
  status: OrderStatus;

  @ApiProperty({
    description: "Data de criação do pedido",
    example: "2026-01-07T13:22:52.354Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Tempo decorrido formatado",
    example: "33m 39s",
  })
  waitingTime: string;

  constructor(
    id: string,
    status: OrderStatus,
    createdAt: Date,
    waitingTime: string
  ) {
    this.id = id;
    this.status = status;
    this.createdAt = createdAt;
    this.waitingTime = waitingTime;
  }
}

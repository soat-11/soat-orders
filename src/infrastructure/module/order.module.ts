import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderController } from "../http/controllers/order.controller";
import { CreateOrderUseCase } from "@core/use-cases/create-order.use-case";
import { OrderOrmEntity } from "../database/entities/order.orm-entity";
import { OrderItemOrmEntity } from "../database/entities/order-item.orm-entity";
import { TypeOrmOrderRepository } from "../database/repositories/typeorm-order.repository";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    MessagingModule,
  ],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    {
      provide: "IOrderRepository",
      useClass: TypeOrmOrderRepository,
    },
  ],
  exports: [],
})
export class OrderModule {}

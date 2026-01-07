import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderController } from "../http/controllers/order.controller";
import { CreateOrderUseCase } from "@core/use-cases/create-order.use-case";
import { OrderOrmEntity } from "../database/entities/order.orm-entity";
import { OrderItemOrmEntity } from "../database/entities/order-item.orm-entity";
import { TypeOrmOrderRepository } from "../database/repositories/typeorm-order.repository";
import { MessagingModule } from "../messaging/messaging.module";
import { ListActiveOrdersUseCase } from "@core/use-cases/list-active-orders.use-case";
import { UpdateOrderStatusUseCase } from "@core/use-cases/update-order-status.use-case";
import { GetOrderUseCase } from "@core/use-cases/get-order.use-case";
import { ProductionEventsConsumer } from "@infra/messaging/consumers/production-events.consumer";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    MessagingModule,
  ],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    ListActiveOrdersUseCase,
    UpdateOrderStatusUseCase,
    GetOrderUseCase,
    ProductionEventsConsumer,
    {
      provide: "IOrderRepository",
      useClass: TypeOrmOrderRepository,
    },
  ],
  exports: [],
})
export class OrderModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@infra/database/database.module";
import { MessagingModule } from "@infra/messaging/messaging.module";
import { OrderModule } from "@infra/module/order.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MessagingModule,
    OrderModule,
  ],
})
export class AppModule {}

import { Module, Global } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SqsEventPublisher } from "./producers/sqs-event-publisher";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "SQS_CLIENT",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new SQSClient({
          region: configService.get("AWS_REGION"),
          endpoint: configService.get("SQS_ENDPOINT"), // Localstack
          credentials: { accessKeyId: "test", secretAccessKey: "test" },
        });
      },
    },
    {
      provide: "IEventPublisher",
      useClass: SqsEventPublisher,
    },
  ],
  exports: ["IEventPublisher"],
})
export class MessagingModule {}

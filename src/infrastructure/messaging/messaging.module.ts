import { Module, Global, Logger } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SqsEventPublisher } from "./producers/sqs-event.publisher";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "SQS_CLIENT",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger("MessagingModule");

        const region = configService.get<string>("AWS_REGION") || "us-east-1";
        const endpoint = configService.get<string>("AWS_ENDPOINT");
        const accessKeyId = configService.get<string>("AWS_ACCESS_KEY_ID");
        const secretAccessKey = configService.get<string>(
          "AWS_SECRET_ACCESS_KEY",
        );

        // --- DEBUG RÁPIDO PARA O PUBLISHER ---
        logger.warn(`[SQS CLIENT FACTORY] Inicializando...`);
        logger.log(`[SQS CLIENT] Region: ${region}`);
        logger.log(
          `[SQS CLIENT] Endpoint: ${endpoint || "UNDEFINED (Usando AWS Real)"}`,
        );
        logger.log(
          `[SQS CLIENT] AccessKey: ${
            accessKeyId ? "DEFINIDO" : 'NÃO DEFINIDO (Usará "test")'
          }`,
        );
        // -------------------------------------

        return new SQSClient({
          region: region,
          ...(endpoint && {
            endpoint: endpoint,
          }),
          credentials: {
            accessKeyId: accessKeyId || "test",
            secretAccessKey: secretAccessKey || "test",
          },
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

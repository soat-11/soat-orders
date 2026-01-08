import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Consumer } from "sqs-consumer";
import { SQSClient } from "@aws-sdk/client-sqs";
import { UpdateOrderStatusUseCase } from "@core/use-cases/update-order-status.use-case";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

@Injectable()
export class ProductionEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private consumers: Consumer[] = [];
  private readonly logger = new Logger(ProductionEventsConsumer.name);

  constructor(
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase
  ) {}

  onModuleInit() {
    this.logger.log("Iniciando consumidores SQS...");

    // 1. Ouvinte: production.started -> Muda para IN_PREPARATION
    const startedConsumer = this.createConsumer(
      process.env.SQS_PRODUCTION_STARTED_URL!,
      OrderStatus.IN_PREPARATION
    );

    // 2. Ouvinte: production.ready -> Muda para READY
    const readyConsumer = this.createConsumer(
      process.env.SQS_PRODUCTION_READY_URL!,
      OrderStatus.READY
    );

    // 2. Ouvinte: production.ready -> Muda para COMPLETED
    const completedConsumer = this.createConsumer(
      process.env.SQS_PRODUCTION_COMPLETED_URL!,
      OrderStatus.COMPLETED
    );

    this.consumers.push(startedConsumer, readyConsumer, completedConsumer);
    this.consumers.forEach((c) => c.start());
  }

  onModuleDestroy() {
    this.logger.log("Parando consumidores SQS...");
    this.consumers.forEach((c) => c.stop());
  }

  private createConsumer(
    queueUrl: string,
    targetStatus: OrderStatus
  ): Consumer {
    return Consumer.create({
      queueUrl,
      sqs: new SQSClient({
        region: process.env.AWS_REGION || "us-east-1",
        endpoint: process.env.SQS_ENDPOINT || "http://localhost:4566",
        credentials: { accessKeyId: "test", secretAccessKey: "test" },
      }),
      handleMessage: async (message) => {
        try {
          const body = JSON.parse(message.Body!);
          const sessionId = body.sessionId;

          this.logger.log(
            `Mensagem recebida da fila [${targetStatus}]. OrderID: ${sessionId}`
          );

          const result = await this.updateOrderStatusUseCase.execute(
            sessionId,
            targetStatus
          );

          if (result.isFailure) {
            this.logger.error(
              `Erro ao atualizar pedido ${sessionId}: ${result.error}`
            );
          } else {
            this.logger.log(
              `Pedido ${sessionId} atualizado para ${targetStatus} com sucesso.`
            );
          }
        } catch (error) {
          this.logger.error("Erro ao processar mensagem SQS:", error);
          throw error;
        }
      },
    });
  }
}

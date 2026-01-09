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
    // ==================================================================
    // 🕵️‍♂️ DEBUG AREA - INÍCIO
    // ==================================================================
    this.logger.warn(">>> INICIANDO DEBUG DE VARIÁVEIS DE AMBIENT<<<");

    // 1. Verificando Região e Endpoint
    // Se AWS_ENDPOINT for undefined, é o correto para AWS real.
    // Se aparecer "localhost", vai dar erro no cluster.
    this.logger.log(
      `[ENV] AWS_REGION: ${
        process.env.AWS_REGION || "NÃO DEFINIDO (Usará default)"
      }`
    );
    this.logger.log(
      `[ENV] AWS_ENDPOINT: ${
        process.env.AWS_ENDPOINT || "UNDEFINED (Isso é BOM para Produção AWS)"
      }`
    );

    // 2. Verificando Credenciais (Segurança: Mostra só o final)
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKey) {
      this.logger.log(
        `[ENV] AWS_ACCESS_KEY_ID: Encontrado (...${accessKey.slice(-4)})`
      );
    } else {
      this.logger.error(
        `[ENV] AWS_ACCESS_KEY_ID: ❌ NÃO ENCONTRADO! Vai usar 'test' e falhar.`
      );
    }

    if (secretKey) {
      this.logger.log(
        `[ENV] AWS_SECRET_ACCESS_KEY: Encontrado (...${secretKey.slice(-4)})`
      );
    } else {
      this.logger.error(
        `[ENV] AWS_SECRET_ACCESS_KEY: ❌ NÃO ENCONTRADO! Vai usar 'test' e falhar.`
      );
    }

    // 3. Verificando URLs das Filas
    this.logger.log(
      `[QUEUE] STARTED URL: ${
        process.env.SQS_PRODUCTION_STARTED_URL || "❌ MISSING"
      }`
    );
    this.logger.log(
      `[QUEUE] READY URL: ${
        process.env.SQS_PRODUCTION_READY_URL || "❌ MISSING"
      }`
    );
    this.logger.log(
      `[QUEUE] COMPLETED URL: ${
        process.env.SQS_PRODUCTION_COMPLETED_URL || "❌ MISSING"
      }`
    );

    this.logger.warn(">>> FIM DO DEBUG <<<");
    // ==================================================================

    this.logger.log("Iniciando consumidores SQS...");

    // Proteção para não quebrar se a URL não existir
    if (!process.env.SQS_PRODUCTION_STARTED_URL) {
      this.logger.error(
        "Abortando inicialização: URLs das filas não definidas."
      );
      return;
    }

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

    // 3. Ouvinte: production.ready -> Muda para COMPLETED
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
    const config = {
      region: process.env.AWS_REGION || "us-east-1",
      ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
      },
    };

    return Consumer.create({
      queueUrl,
      sqs: new SQSClient(config),
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

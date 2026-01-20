import { Test, TestingModule } from "@nestjs/testing";
import { SqsEventPublisher } from "./sqs-event-publisher";
import { ConfigService } from "@nestjs/config";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

describe("SqsEventPublisher", () => {
  let publisher: SqsEventPublisher;
  let mockSqsSend: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "SQS_ORDER_CREATED_URL") return "https://sqs.aws/order-queue";
      return undefined;
    }),
  };

  beforeEach(async () => {
    mockSqsSend = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsEventPublisher,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },

        {
          provide: "SQS_CLIENT",
          useValue: {
            send: mockSqsSend,
          },
        },
      ],
    }).compile();

    publisher = module.get<SqsEventPublisher>(SqsEventPublisher);
  });

  it("deve publicar mensagem RAW JSON (sem envelope NestJS) na fila correta", async () => {
    const payload = { sessionId: "123", idempotencyKey: "abc" };

    await publisher.publish("order.created", payload);

    expect(mockConfigService.get).toHaveBeenCalledWith("SQS_ORDER_CREATED_URL");
    expect(mockSqsSend).toHaveBeenCalledTimes(1);

    const commandCall = mockSqsSend.mock.calls[0][0];

    expect(commandCall).toBeInstanceOf(SendMessageCommand);

    const commandInput = commandCall.input;
    expect(commandInput.QueueUrl).toBe("https://sqs.aws/order-queue");
    expect(commandInput.MessageBody).toBe(JSON.stringify(payload));
  });

  it("deve ignorar e logar aviso se a URL da fila não existir", async () => {
    await publisher.publish("evento.inexistente", {});

    expect(mockConfigService.get).toHaveBeenCalled();

    expect(mockSqsSend).not.toHaveBeenCalled();
  });

  it("deve capturar erro silenciosamente se o SQS falhar", async () => {
    mockSqsSend.mockRejectedValue(new Error("Erro de Conexão AWS"));

    await expect(publisher.publish("order.created", {})).resolves.not.toThrow();

    expect(mockSqsSend).toHaveBeenCalled();
  });
});

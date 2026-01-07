import { Test, TestingModule } from "@nestjs/testing";
import { SqsEventPublisher } from "./sqs-event-publisher";
import { ConfigService } from "@nestjs/config";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Mock do AWS SDK v3
jest.mock("@aws-sdk/client-sqs");

describe("SqsEventPublisher", () => {
  let publisher: SqsEventPublisher;
  let configService: ConfigService;
  let sqsClient: SQSClient;

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === "SQS_ORDER_CREATED_URL") return "http://sqs/order-created";
      return null;
    }),
  };

  const mockSend = jest.fn();

  beforeEach(async () => {
    // 1. IMPORTANTE: Limpa o contador de chamadas antes de cada teste
    jest.clearAllMocks();

    (SQSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsEventPublisher,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: "SQS_CLIENT", useClass: SQSClient },
      ],
    }).compile();

    publisher = module.get<SqsEventPublisher>(SqsEventPublisher);
    // 2. IMPORTANTE: Recupera a instância do ConfigService mockado
    configService = module.get<ConfigService>(ConfigService);
    sqsClient = module.get("SQS_CLIENT");
  });

  it("deve publicar mensagem na fila correta", async () => {
    mockSend.mockResolvedValue({}); // Sucesso AWS

    await publisher.publish("order.created", { id: 1 });

    // Agora configService não é mais undefined
    expect(configService.get).toHaveBeenCalledWith("SQS_ORDER_CREATED_URL");
    expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
  });

  it("deve logar aviso e não enviar se a URL não existir", async () => {
    await publisher.publish("evento.desconhecido", {});
    // Agora vai passar porque o mockSend foi limpo no beforeEach
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("deve capturar erro se o SQS falhar (sem crashar a app)", async () => {
    mockSend.mockRejectedValue(new Error("Erro AWS"));

    await expect(publisher.publish("order.created", {})).resolves.not.toThrow();
  });
});

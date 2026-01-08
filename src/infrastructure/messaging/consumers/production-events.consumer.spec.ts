import { Test, TestingModule } from "@nestjs/testing";
import { ProductionEventsConsumer } from "./production-events.consumer";
import { UpdateOrderStatusUseCase } from "@core/use-cases/update-order-status.use-case";
import { Consumer } from "sqs-consumer";
import { Result } from "@shared/result";

// Mock da biblioteca sqs-consumer
jest.mock("sqs-consumer", () => {
  return {
    Consumer: {
      create: jest.fn(),
    },
  };
});

describe("ProductionEventsConsumer", () => {
  let consumerService: ProductionEventsConsumer;
  let useCase: UpdateOrderStatusUseCase;

  // Mock do Use Case
  const mockUseCase = {
    execute: jest.fn(),
  };

  // Mock das instâncias de Consumer criadas
  const mockConsumerInstance = {
    start: jest.fn(),
    stop: jest.fn(),
  };

  beforeEach(async () => {
    // Configurar variáveis de ambiente necessárias para os 3 consumidores
    process.env.SQS_PRODUCTION_STARTED_URL = "http://sqs/started";
    process.env.SQS_PRODUCTION_READY_URL = "http://sqs/ready";
    process.env.SQS_PRODUCTION_COMPLETED_URL = "http://sqs/completed";

    jest.clearAllMocks(); // Limpa chamadas anteriores

    (Consumer.create as jest.Mock).mockReturnValue(mockConsumerInstance);
    mockUseCase.execute.mockResolvedValue(Result.ok());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionEventsConsumer,
        { provide: UpdateOrderStatusUseCase, useValue: mockUseCase },
      ],
    }).compile();

    consumerService = module.get<ProductionEventsConsumer>(
      ProductionEventsConsumer
    );
    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
  });

  it("deve iniciar os 3 consumidores no onModuleInit", () => {
    consumerService.onModuleInit();

    expect(Consumer.create).toHaveBeenCalledTimes(3);
    expect(mockConsumerInstance.start).toHaveBeenCalledTimes(3);
  });

  it("deve parar os 3 consumidores no onModuleDestroy", () => {
    consumerService.onModuleInit(); // Inicia para popular o array

    consumerService.onModuleDestroy();

    expect(mockConsumerInstance.stop).toHaveBeenCalledTimes(3);
  });

  it("deve processar mensagem e chamar o UseCase com sessionId correto", async () => {
    jest.clearAllMocks();
    (Consumer.create as jest.Mock).mockReturnValue(mockConsumerInstance);

    consumerService.onModuleInit();

    const config = (Consumer.create as jest.Mock).mock.calls[0][0];
    const handleMessage = config.handleMessage;

    const message = {
      Body: JSON.stringify({ sessionId: "123" }),
    };

    await handleMessage(message);

    expect(useCase.execute).toHaveBeenCalledWith("123", expect.any(String));
  });

  it("deve logar erro mas não falhar se o UseCase retornar failure", async () => {
    consumerService.onModuleInit();
    const config = (Consumer.create as jest.Mock).mock.calls[0][0];

    mockUseCase.execute.mockResolvedValue(Result.fail("Erro lógica"));

    const message = { Body: JSON.stringify({ sessionId: "123" }) };

    await expect(config.handleMessage(message)).resolves.not.toThrow();
  });
});

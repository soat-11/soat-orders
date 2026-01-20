import { Test, TestingModule } from "@nestjs/testing";
import { CreateOrderUseCase } from "./create-order.use-case";
import { Order } from "../domain/entities/order.entity";
import { OrderStatus } from "../domain/enum/order-status.enum";
import { OrderItem } from "../domain/entities/order-item.entity";

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;

  const mockOrderRepo = {
    create: jest.fn(),
  };
  const mockEventPublisher = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: "IOrderRepository", useValue: mockOrderRepo },
        { provide: "IEventPublisher", useValue: mockEventPublisher },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  it("deve criar um pedido e publicar o evento com o payload correto para Payment", async () => {
    const sessionId = "session-1";
    const orderId = "123";
    const input = {
      items: [{ sku: "X", quantity: 1, unitPrice: 100 }],
      totalValue: 100,
    };

    const mockOrder = new Order(
      sessionId,
      [] as unknown as OrderItem[],
      100,
      OrderStatus.RECEIVED,
      orderId,
      new Date(),
    );
    mockOrderRepo.create.mockResolvedValue(mockOrder);

    const result = await useCase.execute(sessionId, input);

    expect(result.isSuccess).toBeTruthy();
    expect(mockOrderRepo.create).toHaveBeenCalled();

    expect(mockEventPublisher.publish).toHaveBeenCalledWith("order.created", {
      sessionId: sessionId,
      idempotencyKey: orderId,
    });

    const output = result.getValue();
    expect(output.orderId).toBe(orderId);
    expect(output.sessionId).toBe(sessionId); // Novo campo
    expect(output.status).toBe(OrderStatus.RECEIVED);
  });

  it("deve retornar erro se o repositório falhar", async () => {
    mockOrderRepo.create.mockRejectedValue(new Error("Erro de conexão"));
    const result = await useCase.execute("session-1", {
      items: [],
      totalValue: 0,
    });
    expect(result.isFailure).toBeTruthy();
  });
});

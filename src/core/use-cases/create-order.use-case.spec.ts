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

  it("deve criar um pedido e publicar o evento com sucesso", async () => {
    const input = {
      items: [{ sku: "X", quantity: 1, unitPrice: 100 }],
      totalValue: 100,
    };

    const mockOrder = new Order(
      "session-1",
      [] as unknown as OrderItem[],
      100,
      OrderStatus.RECEIVED,
      "123",
      new Date()
    );
    mockOrderRepo.create.mockResolvedValue(mockOrder);
    const result = await useCase.execute("session-1", input);

    expect(result.isSuccess).toBeTruthy();
    expect(mockOrderRepo.create).toHaveBeenCalled();
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      "order.created",
      expect.any(Object)
    );
    expect(result.getValue().orderId).toBe("123");
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

import { Test, TestingModule } from "@nestjs/testing";
import { GetOrderUseCase } from "./get-order.use-case";
import { Order } from "../domain/entities/order.entity";
import { OrderStatus } from "../domain/enum/order-status.enum";
import { OrderItem } from "../domain/entities/order-item.entity";

describe("GetOrderUseCase", () => {
  let useCase: GetOrderUseCase;

  const mockOrderRepo = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderUseCase,
        { provide: "IOrderRepository", useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetOrderUseCase>(GetOrderUseCase);
  });

  it("deve retornar o pedido quando encontrado", async () => {
    const mockOrder = new Order(
      "session-1",
      [] as unknown as OrderItem[],
      50,
      OrderStatus.RECEIVED,
      "123"
    );
    mockOrderRepo.findById.mockResolvedValue(mockOrder);

    const result = await useCase.execute("123");

    expect(result.isSuccess).toBeTruthy();
    expect(result.getValue().orderId).toBe("123");
  });

  it("deve retornar erro se o pedido não for encontrado", async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute("999");

    expect(result.isFailure).toBeTruthy();
    expect(result.error).toBe("Pedido não encontrado");
  });
});

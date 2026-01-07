import { Test, TestingModule } from "@nestjs/testing";
import { UpdateOrderStatusUseCase } from "./update-order-status.use-case";
import { Order } from "../domain/entities/order.entity";
import { OrderStatus } from "../domain/enum/order-status.enum";
import { OrderItem } from "../domain/entities/order-item.entity";

describe("UpdateOrderStatusUseCase", () => {
  let useCase: UpdateOrderStatusUseCase;

  const mockOrderRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        { provide: "IOrderRepository", useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
  });

  it("deve atualizar o status com sucesso", async () => {
    const order = new Order(
      "s1",
      [] as unknown as OrderItem[],
      10,
      OrderStatus.RECEIVED,
      "123"
    );
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.create.mockResolvedValue(order);

    const result = await useCase.execute("123", OrderStatus.IN_PREPARATION);

    expect(result.isSuccess).toBeTruthy();
    expect(order.status).toBe(OrderStatus.IN_PREPARATION);
    expect(mockOrderRepo.create).toHaveBeenCalledWith(order);
  });

  it("deve retornar erro se pedido não existe", async () => {
    mockOrderRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute("999", OrderStatus.IN_PREPARATION);
    expect(result.isFailure).toBeTruthy();
    expect(result.error).toContain("não encontrado");
  });

  it("deve capturar erro de domínio (Regra de Negócio)", async () => {
    const order = new Order(
      "s1",
      [] as unknown as OrderItem[],
      10,
      OrderStatus.READY,
      "123"
    );
    mockOrderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute("123", OrderStatus.IN_PREPARATION);

    expect(result.isFailure).toBeTruthy();
    expect(result.error).toContain("não pode voltar");
  });
});

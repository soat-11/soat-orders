import { Test, TestingModule } from "@nestjs/testing";
import { ListActiveOrdersUseCase } from "./list-active-orders.use-case";
import { Order } from "../domain/entities/order.entity";
import { OrderStatus } from "../domain/enum/order-status.enum";
import { OrderItem } from "../domain/entities/order-item.entity";

describe("ListActiveOrdersUseCase", () => {
  let useCase: ListActiveOrdersUseCase;

  const mockOrderRepo = {
    findManyByStatus: jest.fn(),
  };

  const makeOrder = (status: OrderStatus, id: string) =>
    new Order("s1", [] as unknown as OrderItem[], 10, status, id, new Date());

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListActiveOrdersUseCase,
        { provide: "IOrderRepository", useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<ListActiveOrdersUseCase>(ListActiveOrdersUseCase);
  });

  it("deve retornar lista ordenada: Pronto > Em Preparação > Recebido", async () => {
    const orderReceived = makeOrder(OrderStatus.RECEIVED, "1");
    const orderReady = makeOrder(OrderStatus.READY, "2");
    const orderPrep = makeOrder(OrderStatus.IN_PREPARATION, "3");

    mockOrderRepo.findManyByStatus.mockResolvedValue([
      orderReceived,
      orderReady,
      orderPrep,
    ]);

    const result = await useCase.execute();

    expect(result.isSuccess).toBeTruthy();
    const list = result.getValue();

    expect(list[0].status).toBe(OrderStatus.READY);
    expect(list[1].status).toBe(OrderStatus.IN_PREPARATION);
    expect(list[2].status).toBe(OrderStatus.RECEIVED);
  });

  it("deve retornar erro se o banco falhar", async () => {
    mockOrderRepo.findManyByStatus.mockRejectedValue(new Error("Falha DB"));
    const result = await useCase.execute();
    expect(result.isFailure).toBeTruthy();
  });
});

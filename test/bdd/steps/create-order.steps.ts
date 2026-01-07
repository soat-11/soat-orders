import { loadFeature, defineFeature } from "jest-cucumber";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateOrderUseCase } from "../../../src/core/use-cases/create-order.use-case";
import { OrderStatus } from "../../../src/core/domain/enum/order-status.enum";
import { IOrderRepository } from "../../../src/core/domain/repositories/i-order.repository";
import { IEventPublisher } from "../../../src/core/domain/events/i-event-publisher";
import { Order } from "../../../src/core/domain/entities/order.entity";
import { OrderItem } from "../../../src/core/domain/entities/order-item.entity";

// Carrega o arquivo .feature
const feature = loadFeature("./test/bdd/features/create-order.feature");

defineFeature(feature, (test) => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: any;
  let mockEventPublisher: any;

  let inputSessionId: string;
  let inputItems: any[];
  let response: any;

  // Setup antes de cada cenário (igual ao beforeEach)
  beforeEach(async () => {
    mockOrderRepo = {
      create: jest.fn().mockImplementation((order) =>
        Promise.resolve({
          ...order,
          id: "generated-uuid",
          createdAt: new Date(),
        })
      ),
    };
    mockEventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: "IOrderRepository", useValue: mockOrderRepo },
        { provide: "IEventPublisher", useValue: mockEventPublisher },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  // --- CENÁRIO 1: SUCESSO ---
  test("Criar um pedido com sucesso", ({ given, and, when, then }) => {
    given(/^que o cliente possui a sessão "(.*)"$/, (sessionId) => {
      inputSessionId = sessionId;
    });

    and(
      /^que o carrinho contém um "(.*)" com preço (.*)$/,
      (itemName, itemPrice) => {
        inputItems = [
          {
            sku: itemName,
            quantity: 1,
            unitPrice: parseFloat(itemPrice),
          },
        ];
      }
    );

    when("o cliente solicita o checkout", async () => {
      response = await useCase.execute(inputSessionId, {
        items: inputItems,
        totalValue: inputItems.reduce((acc, i) => acc + i.unitPrice, 0),
      });
    });

    then("o pedido deve ser gerado com sucesso", () => {
      expect(response.isSuccess).toBe(true);
      expect(response.getValue().orderId).toBeDefined();
    });

    and(/^o status inicial deve ser "(.*)"$/, (status) => {
      expect(response.getValue().status).toBe(status);
    });

    and(/^o evento "(.*)" deve ser publicado$/, (eventName) => {
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        eventName,
        expect.any(Object)
      );
    });
  });

  // --- CENÁRIO 2: ERRO ---
  test("Tentativa de checkout com carrinho vazio", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^que o cliente possui a sessão "(.*)"$/, (sessionId) => {
      inputSessionId = sessionId;
    });

    and("que o carrinho está vazio", () => {
      inputItems = [];
    });

    when("o cliente solicita o checkout", async () => {
      // Aqui esperamos que o useCase retorne um Result.fail ou lance erro
      // No seu código atual, ele retorna Result.fail quando dá erro no catch
      // Mas a validação de item vazio está na Entidade (throw Error)
      // O UseCase captura o erro da entidade e retorna Result.fail
      response = await useCase.execute(inputSessionId, {
        items: inputItems,
        totalValue: 0,
      });
    });

    then("o sistema deve retornar um erro de validação", () => {
      expect(response.isFailure).toBe(true);
      // Verifica se a mensagem de erro veio da entidade Order
      expect(response.error).toContain("pelo menos um item");
    });
  });
});

import { Order } from "./order.entity";
import { OrderStatus } from "../enum/order-status.enum";
import { OrderItem } from "./order-item.entity";

describe("Order Entity", () => {
  // Mock de um item simples para usar nos testes
  const mockItem = {
    sku: "BURGER",
    quantity: 1,
    price: 10,
    subTotal: 10,
  } as unknown as OrderItem;

  it("deve criar um pedido com sucesso quando os dados forem válidos", () => {
    const order = Order.create("session-123", [mockItem], 50);

    expect(order).toBeDefined();
    expect(order.items.length).toBe(1);
    expect(order.status).toBe(OrderStatus.RECEIVED);
    expect(order.totalValue).toBe(50);
  });

  it("deve lançar erro ao tentar criar pedido sem itens", () => {
    expect(() => {
      Order.create("session-123", [], 50);
    }).toThrow("O pedido deve conter pelo menos um item.");
  });

  it("deve atualizar o status corretamente (Caminho Feliz)", () => {
    const order = Order.create("session-123", [mockItem], 50);

    order.changeStatus(OrderStatus.IN_PREPARATION);
    expect(order.status).toBe(OrderStatus.IN_PREPARATION);

    order.changeStatus(OrderStatus.READY);
    expect(order.status).toBe(OrderStatus.READY);
  });

  it("não deve fazer nada se o novo status for igual ao atual (Idempotência)", () => {
    const order = Order.create("session-123", [mockItem], 50);

    // Tenta mudar para o mesmo status
    order.changeStatus(OrderStatus.RECEIVED);

    expect(order.status).toBe(OrderStatus.RECEIVED);
  });

  it("deve lançar erro ao tentar alterar um pedido já FINALIZADO", () => {
    const order = Order.create("session-123", [mockItem], 50);
    // Forçamos o status para teste
    order.status = OrderStatus.COMPLETED;

    expect(() => {
      order.changeStatus(OrderStatus.RECEIVED);
    }).toThrow(
      "O pedido já está finalizado ou cancelado e não pode ser alterado."
    );
  });

  it("deve lançar erro ao tentar alterar um pedido já CANCELADO", () => {
    const order = Order.create("session-123", [mockItem], 50);
    order.status = OrderStatus.CANCELLED;

    expect(() => {
      order.changeStatus(OrderStatus.RECEIVED);
    }).toThrow(
      "O pedido já está finalizado ou cancelado e não pode ser alterado."
    );
  });

  it("deve lançar erro ao tentar CANCELAR um pedido que já está PRONTO", () => {
    const order = Order.create("session-123", [mockItem], 50);
    order.status = OrderStatus.READY;

    expect(() => {
      order.changeStatus(OrderStatus.CANCELLED);
    }).toThrow(
      "Não é possível cancelar um pedido que já está pronto para retirada."
    );
  });

  it("deve lançar erro ao tentar voltar de PRONTO para EM PREPARAÇÃO (Regra de Retorno)", () => {
    const order = Order.create("session-123", [mockItem], 50);
    order.status = OrderStatus.READY;

    expect(() => {
      order.changeStatus(OrderStatus.IN_PREPARATION);
    }).toThrow("O pedido já está pronto, não pode voltar para preparação.");
  });
});

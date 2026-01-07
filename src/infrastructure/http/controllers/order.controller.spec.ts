import { Test, TestingModule } from "@nestjs/testing";
import { OrderController } from "./order.controller";
import { CreateOrderUseCase } from "@core/use-cases/create-order.use-case";
import { ListActiveOrdersUseCase } from "@core/use-cases/list-active-orders.use-case";
import { UpdateOrderStatusUseCase } from "@core/use-cases/update-order-status.use-case";
import { GetOrderUseCase } from "@core/use-cases/get-order.use-case";
import { Response } from "express";
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  HttpStatus,
} from "@nestjs/common";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockSuccess = (value: any) => ({
  isFailure: false,
  getValue: () => value,
  error: null,
});

const mockFailure = (error: string) => ({
  isFailure: true,
  getValue: () => null,
  error: error,
});

describe("OrderController", () => {
  let controller: OrderController;
  let createUseCase: Partial<CreateOrderUseCase>;
  let listUseCase: Partial<ListActiveOrdersUseCase>;
  let updateUseCase: Partial<UpdateOrderStatusUseCase>;
  let getUseCase: Partial<GetOrderUseCase>;
  let response: Response;

  beforeEach(async () => {
    response = mockResponse();

    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };
    getUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        { provide: CreateOrderUseCase, useValue: createUseCase },
        { provide: ListActiveOrdersUseCase, useValue: listUseCase },
        { provide: UpdateOrderStatusUseCase, useValue: updateUseCase },
        { provide: GetOrderUseCase, useValue: getUseCase },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  describe("checkout", () => {
    const sessionId = "session-123";
    const body = { items: [], totalValue: 50 };

    it("deve retornar erro 400 se não enviar session-id", async () => {
      await expect(controller.checkout("", body, response)).rejects.toThrow(
        BadRequestException
      );
    });

    it("deve criar pedido com sucesso (Status 201)", async () => {
      // Configura o UseCase para retornar sucesso
      (createUseCase.execute as jest.Mock).mockResolvedValue(
        mockSuccess({ id: "123", status: "RECEIVED" })
      );

      await controller.checkout(sessionId, body, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "123" })
      );
    });

    it("deve lançar BadRequest se o UseCase falhar", async () => {
      // Configura falha (ex: carrinho vazio)
      (createUseCase.execute as jest.Mock).mockResolvedValue(
        mockFailure("Carrinho vazio")
      );

      await expect(
        controller.checkout(sessionId, body, response)
      ).rejects.toThrow(BadRequestException);
    });

    it("deve lançar InternalServerError se ocorrer erro inesperado", async () => {
      // Simula um erro não tratado (crash)
      (createUseCase.execute as jest.Mock).mockRejectedValue(
        new Error("Crash no banco")
      );

      await expect(
        controller.checkout(sessionId, body, response)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("listActive", () => {
    it("deve retornar lista de pedidos (Status 200)", async () => {
      const mockList = [{ id: "1", status: "READY" }];
      (listUseCase.execute as jest.Mock).mockResolvedValue(
        mockSuccess(mockList)
      );

      await controller.listActive(response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({ data: mockList });
    });

    it("deve lançar erro interno se o UseCase falhar", async () => {
      (listUseCase.execute as jest.Mock).mockResolvedValue(
        mockFailure("Erro DB")
      );

      await expect(controller.listActive(response)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateStatus", () => {
    const orderId = "order-123";
    const body = { status: OrderStatus.IN_PREPARATION };

    it("deve atualizar com sucesso (Status 200)", async () => {
      (updateUseCase.execute as jest.Mock).mockResolvedValue(mockSuccess(true));

      await controller.updateStatus(orderId, body, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        message: "Status atualizado com sucesso",
      });
    });

    it('deve lançar NotFoundException se o erro contiver "não encontrado"', async () => {
      // Simula erro específico de ID inexistente
      (updateUseCase.execute as jest.Mock).mockResolvedValue(
        mockFailure("Pedido não encontrado no banco")
      );

      await expect(
        controller.updateStatus(orderId, body, response)
      ).rejects.toThrow(NotFoundException);
    });

    it("deve lançar BadRequestException para outras falhas (ex: transição inválida)", async () => {
      (updateUseCase.execute as jest.Mock).mockResolvedValue(
        mockFailure("Não pode voltar status")
      );

      await expect(
        controller.updateStatus(orderId, body, response)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findById", () => {
    const orderId = "order-123";

    it("deve retornar o pedido se encontrado (Status 200)", async () => {
      const mockOrder = { id: orderId, totalValue: 50 };
      (getUseCase.execute as jest.Mock).mockResolvedValue(
        mockSuccess(mockOrder)
      );

      await controller.findById(orderId, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockOrder,
        })
      );
    });

    it("deve lançar NotFoundException se não achar", async () => {
      (getUseCase.execute as jest.Mock).mockResolvedValue(
        mockFailure("Not Found")
      );

      await expect(controller.findById(orderId, response)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

import {
  Controller,
  Post,
  Body,
  Res,
  Headers,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  Get,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { CreateOrderUseCase } from "@core/use-cases/create-order.use-case";
import { CreateOrderInputDto } from "../dto/create-order.input";
import { CreateOrderOutputDto } from "../dto/create-order.output";
import { ListOrderOutputDto } from "../dto/list-order.output";
import { ListActiveOrdersUseCase } from "@core/use-cases/list-active-orders.use-case";

@ApiTags("orders")
@Controller("orders")
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listActiveOrdersUseCase: ListActiveOrdersUseCase
  ) {}

  @Post("checkout")
  @ApiOperation({
    summary: "Realiza o Checkout do Pedido",
    description:
      "Recebe os itens do carrinho, cria o pedido no banco com status RECEIVED e publica evento na fila.",
  })
  @ApiHeader({
    name: "session-id",
    description: "ID da sessão do usuário (UUID)",
    required: true,
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiBody({ type: CreateOrderInputDto })
  @ApiResponse({
    status: 201,
    description: "Pedido criado com sucesso.",
    type: CreateOrderOutputDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Dados inválidos ou regra de negócio violada (ex: Carrinho vazio).",
  })
  @ApiResponse({
    status: 500,
    description: "Erro interno no processamento (Banco ou Fila fora do ar).",
  })
  async checkout(
    @Headers("session-id") sessionId: string,
    @Body() body: CreateOrderInputDto,
    @Res() res: Response
  ) {
    if (!sessionId) {
      throw new BadRequestException('O header "session-id" é obrigatório.');
    }

    try {
      const result = await this.createOrderUseCase.execute(sessionId, body);

      if (result.isFailure) {
        throw new BadRequestException({
          message: "Não foi possível criar o pedido.",
          error: result.error,
        });
      }

      const orderOutput = result.getValue();
      return res.status(HttpStatus.CREATED).json(orderOutput);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro inesperado ao processar o checkout."
      );
    }
  }

  @Get()
  @ApiOperation({ summary: "Listar pedidos ativos (Cozinha)" })
  @ApiResponse({
    status: 200,
    description: "Lista ordenada: Pronto > Em Preparação > Recebido",
    type: [ListOrderOutputDto],
  })
  async listActive(@Res() res: Response) {
    const result = await this.listActiveOrdersUseCase.execute();

    if (result.isFailure) {
      throw new InternalServerErrorException(result.error);
    }

    return res.status(HttpStatus.OK).json({
      data: result.getValue(),
    });
  }
}

import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsNotEmpty,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class OrderItemInputDto {
  @ApiProperty({
    description: "Código único do produto (SKU)",
    example: "HAMBURGER-X-TUDO",
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: "Quantidade do item (deve ser maior que zero)",
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: "Preço unitário no momento da compra",
    example: 25.9,
  })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class CreateOrderInputDto {
  @ApiProperty({
    description: "Lista de itens do pedido",
    type: [OrderItemInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({
    description: "Valor total do pedido (Soma dos itens)",
    example: 51.8,
  })
  @IsNumber()
  @IsPositive()
  totalValue: number;
}

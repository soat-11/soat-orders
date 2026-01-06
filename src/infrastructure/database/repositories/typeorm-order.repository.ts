import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IOrderRepository } from "@core/domain/repositories/i-order.repository";
import { Order } from "@core/domain/entities/order.entity";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { OrderMapper } from "../mappers/order.mapper";

@Injectable()
export class TypeOrmOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>
  ) {}

  async create(order: Order): Promise<Order> {
    const entity = OrderMapper.toPersistence(order);
    const savedEntity = await this.repository.save(entity);

    return OrderMapper.toDomain(savedEntity);
  }
}

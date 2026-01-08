import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { IOrderRepository } from "@core/domain/repositories/i-order.repository";
import { Order } from "@core/domain/entities/order.entity";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { OrderMapper } from "../mappers/order.mapper";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

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

  async findManyByStatus(statuses: OrderStatus[]): Promise<Order[]> {
    const entities = await this.repository.find({
      where: {
        status: In(statuses),
      },

      order: {
        createdAt: "ASC",
      },
      relations: ["items"],
    });

    return entities.map(OrderMapper.toDomain);
  }

  async findById(idOrSession: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: [{ id: idOrSession }, { sessionId: idOrSession }],
      relations: ["items"],
    });

    if (!entity) return null;

    return OrderMapper.toDomain(entity);
  }
}

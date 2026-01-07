import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmOrderRepository } from "./typeorm-order.repository";
import { getRepositoryToken } from "@nestjs/typeorm";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { Order } from "@core/domain/entities/order.entity";
import { OrderStatus } from "@core/domain/enum/order-status.enum";
import { Repository } from "typeorm";

describe("TypeOrmOrderRepository", () => {
  let repository: TypeOrmOrderRepository;
  let typeOrmRepo: Repository<OrderOrmEntity>;

  const mockTypeOrmRepo = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmOrderRepository,
        {
          provide: getRepositoryToken(OrderOrmEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmOrderRepository>(TypeOrmOrderRepository);
    typeOrmRepo = module.get(getRepositoryToken(OrderOrmEntity));
  });

  it("deve salvar um pedido (create)", async () => {
    const orderDomain = new Order("s1", [], 10);
    const savedEntity = { ...orderDomain, id: "1", items: [] };

    // Mock do save retornando a entidade com ID
    mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

    const result = await repository.create(orderDomain);

    expect(typeOrmRepo.save).toHaveBeenCalled();
    expect(result.id).toBe("1");
  });

  it("deve buscar por status (findManyByStatus)", async () => {
    const entities = [{ id: "1", items: [], totalValue: 10 }];
    mockTypeOrmRepo.find.mockResolvedValue(entities);

    const result = await repository.findManyByStatus([OrderStatus.RECEIVED]);

    expect(typeOrmRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: expect.any(Object) } })
    );
    expect(result.length).toBe(1);
  });

  it("deve buscar por ID (findById) retornando null se não achar", async () => {
    mockTypeOrmRepo.findOne.mockResolvedValue(null);
    const result = await repository.findById("999");
    expect(result).toBeNull();
  });
});

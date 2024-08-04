import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto';
import { NATS_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';
import { IProduct } from './interfaces/product.interface';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }
  private logger = new Logger('OrdersService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    /* 1. Validate products */
    const productIds = createOrderDto.items.map(({ id }) => id);
    const products = await firstValueFrom(
      this.client.send<IProduct[]>({ cmd: 'validate_products' }, productIds),
    );

    const productMap = products.reduce(
      (map, product) => {
        map[product.id] = product;
        return map;
      },
      {} as { [key: string]: IProduct },
    );

    /* 2. Calculate amount */
    const totalAmount = createOrderDto.items.reduce(
      (acc, orderItem) =>
        acc + productMap[orderItem.id].price * orderItem.quantity,
      0,
    );

    /* 3. Total items */
    const totalItems = createOrderDto.items.reduce(
      (acc, curr) => acc + curr.quantity,
      0,
    );

    const order = await this.order.create({
      include: {
        orderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
      data: {
        totalAmount,
        totalItems,
        orderItem: {
          createMany: {
            data: createOrderDto.items.map(
              ({ id: productId, price, quantity }) => ({
                productId,
                price,
                quantity,
              }),
            ),
          },
        },
      },
    });

    return {
      ...order,
      orderItem: order.orderItem.map((orderItem) => ({
        ...orderItem,
        name: productMap[orderItem.productId].name,
      })),
    };
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const total = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;
    const data = await this.order.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where: {
        status: orderPaginationDto.status,
      },
    });

    return {
      data,
      meta: {
        total,
        totalPages: Math.ceil(total / perPage),
        page: currentPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({
      where: {
        id,
      },
      include: {
        orderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    const productIds = order.orderItem.map(({ productId }) => productId);
    const products = await firstValueFrom(
      this.client.send<IProduct[]>({ cmd: 'validate_products' }, productIds),
    );
    const productMap = products.reduce(
      (map, product) => {
        map[product.id] = product;
        return map;
      },
      {} as { [key: string]: IProduct },
    );

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }
    return {
      ...order,
      orderItem: order.orderItem.map((orderItem) => ({
        ...orderItem,
        name: productMap[orderItem.productId].name,
      })),
    };
  }

  async changeStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}

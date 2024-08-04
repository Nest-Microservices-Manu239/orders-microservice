import { OrderStatus } from '@prisma/client';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsUUID()
  id: string;

  @IsIn(OrderStatusList, {
    message: `Possible status values are ${OrderStatusList}`,
  })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;
}

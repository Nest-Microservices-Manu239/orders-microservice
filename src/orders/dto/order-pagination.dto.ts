import { PaginatioDto } from 'src/common/dtos/pagination.dto';
import { OrderStatusList } from '../enum/order.enum';
import { IsIn, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderPaginationDto extends PaginatioDto {
  @IsIn(OrderStatusList, {
    message: `Possible status values are ${OrderStatusList}`,
  })
  @IsOptional()
  status: OrderStatus;
}

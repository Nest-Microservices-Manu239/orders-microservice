import { IsNumber, IsPositive } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}

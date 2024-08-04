import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginatioDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page: number = 1;
}

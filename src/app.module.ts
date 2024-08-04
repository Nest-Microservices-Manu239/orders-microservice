import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [OrdersModule, CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

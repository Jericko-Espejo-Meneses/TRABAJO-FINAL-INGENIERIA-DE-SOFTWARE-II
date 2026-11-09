import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class AdvanceStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
    description: 'Nuevo estado para avanzar el pedido y simular el tracking en tiempo real',
  })
  @IsEnum(OrderStatus, { message: 'Estado de pedido no válido' })
  status: OrderStatus;
}

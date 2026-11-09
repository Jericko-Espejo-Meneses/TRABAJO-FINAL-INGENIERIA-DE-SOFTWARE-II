import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 4: Carrito, Pedidos y Pagos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HE-HU9-009: Seleccionar método de pago y procesar el pago',
    description: 'Procesa el pago con Tarjeta (Crédito/Débito), Billetera (Yape/Plin) o Efectivo, actualiza la orden a CONFIRMED y activa la donación automática (HE-HU5-005).',
  })
  @ApiResponse({ status: 200, description: 'Pago aprobado, pedido confirmado y donación registrada' })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos o la orden no se encuentra pendiente de pago' })
  async processPayment(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentsService.processPayment(user.id, dto);
  }

  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Obtener comprobante de pago de una orden',
    description: 'Recupera los datos de la transacción de pago y boleta de una orden.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Comprobante de pago recuperado' })
  @ApiResponse({ status: 404, description: 'Comprobante no encontrado' })
  async getPaymentByOrder(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPaymentByOrder(orderId, user.id);
  }
}

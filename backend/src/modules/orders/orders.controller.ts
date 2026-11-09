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
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 4, 5 y 7: Pedidos, Historial y Seguimiento en Tiempo Real')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller(['orders', 'pedidos'])
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU8-008: Confirmar pedido a partir del carrito de compras',
    description: 'Transforma el carrito activo del usuario en una orden formal con dirección de entrega, contacto y resumen nutricional.',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente con estado PENDING_PAYMENT' })
  @ApiResponse({ status: 400, description: 'El carrito está vacío o no contiene datos válidos' })
  async checkout(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: CheckoutOrderDto,
  ) {
    return this.ordersService.checkoutFromCart(user.id, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU8-008 & HE-HU9-009: Crear y confirmar pedido directamente (Checkout Frontend)',
    description: 'Recibe el pedido estructurado con productos, pago y donación automática desde el frontend.',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado y confirmado' })
  async createDirect(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() body: any,
  ) {
    return this.ordersService.createDirectOrder(user.id, body);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos del usuario',
    description: 'Retorna todas las órdenes históricas y actuales realizadas por el usuario.',
  })
  @ApiResponse({ status: 200, description: 'Listado del historial de pedidos' })
  async listOrders(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.ordersService.getOrderHistory(user.id);
  }

  @Get('history')
  @ApiOperation({
    summary: 'HE-HU6-006: Visualizar historial de pedidos del usuario',
    description: 'Retorna todas las órdenes históricas y actuales realizadas por el usuario con su detalle de ítems y estado.',
  })
  @ApiResponse({ status: 200, description: 'Listado del historial de pedidos' })
  async getOrderHistory(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.ordersService.getOrderHistory(user.id);
  }

  @Get(':id/track')
  @ApiOperation({
    summary: 'HE-HU13-013: Visualizar en tiempo real el estado y seguimiento del pedido',
    description: 'Retorna la línea de tiempo en vivo, progreso porcentual, tiempo estimado y datos del repartidor en camino.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden a rastrear' })
  @ApiResponse({ status: 200, description: 'Información de tracking en tiempo real' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async trackOrder(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.trackOrder(orderId, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle completo de un pedido específico',
    description: 'Retorna los datos completos de un pedido incluyendo desglose de ítems, precio y entrega.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async getOrderById(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderById(orderId, user.id);
  }

  @Post(':id/advance-status')
  @ApiOperation({
    summary: 'Avanzar estado del pedido (Simulador de Tracking en Tiempo Real)',
    description: 'Permite avanzar el pedido a CONFIRMED, PREPARING, ON_THE_WAY o DELIVERED para probar la experiencia en vivo de HE-HU13-013.',
  })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Estado actualizado y evento de notificación disparado' })
  async advanceStatus(
    @Param('id') orderId: string,
    @Body() dto: AdvanceStatusDto,
  ) {
    return this.ordersService.advanceOrderStatus(orderId, dto.status);
  }
}

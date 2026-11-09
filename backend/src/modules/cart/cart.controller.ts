import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 3: Carrito, Pedidos y Pagos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'HE-HU4-004: Visualizar el carrito de compras del usuario',
    description: 'Retorna los productos añadidos, totales monetarios (subtotal, delivery, total) y el desglose de nutrición acumulada (calorías, proteínas, carbos, grasas).',
  })
  @ApiResponse({ status: 200, description: 'Carrito activo recuperado con éxito' })
  @ApiResponse({ status: 401, description: 'No autorizado / Token requerido' })
  async getCart(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HE-HU4-004: Agregar un producto o plato saludable al carrito',
    description: 'Añade el producto especificado al carrito con la cantidad e instrucciones especiales deseadas.',
  })
  @ApiResponse({ status: 200, description: 'Producto agregado al carrito exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async addItem(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({
    summary: 'HE-HU4-004: Actualizar cantidad o detalles de un producto en el carrito',
    description: 'Modifica la cantidad o instrucciones de un ítem existente. Si quantity es 0, se remueve el ítem.',
  })
  @ApiParam({ name: 'itemId', description: 'ID del ítem dentro del carrito (no el ID del plato)' })
  @ApiResponse({ status: 200, description: 'Ítem actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado en el carrito' })
  async updateItem(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'HE-HU4-004: Eliminar un producto específico del carrito',
    description: 'Remueve el producto indicado y recalcula subtotales y macronutrientes.',
  })
  @ApiParam({ name: 'itemId', description: 'ID del ítem dentro del carrito' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado en el carrito' })
  async removeItem(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  @ApiOperation({
    summary: 'HE-HU4-004: Vaciar completamente el carrito de compras',
    description: 'Limpia todos los productos del carrito del usuario activo.',
  })
  @ApiResponse({ status: 200, description: 'Carrito vaciado exitosamente' })
  async clearCart(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.cartService.clearCart(user.id);
  }
}

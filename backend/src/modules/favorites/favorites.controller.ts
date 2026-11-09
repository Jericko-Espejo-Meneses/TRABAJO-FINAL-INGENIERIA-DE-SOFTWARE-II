import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoriteType } from './entities/favorite.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 8: Favoritos y Productos Detallados')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({
    summary: 'HE-HU12-012: Listar restaurantes y menús favoritos del usuario',
    description: 'Devuelve las dos listas separadas de restaurantes y platos favoritos guardados por el usuario.',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de favoritos' })
  async getUserFavorites(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.favoritesService.getUserFavorites(user.id);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HE-HU12-012: Alternar favorito (Agregar o Quitar con un solo clic)',
    description: 'Si el restaurante o menú ya era favorito, lo quita. Si no lo era, lo agrega.',
  })
  @ApiResponse({ status: 200, description: 'Estado de favorito alternado' })
  async toggleFavorite(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: ToggleFavoriteDto,
  ) {
    return this.favoritesService.toggleFavorite(user.id, dto);
  }

  @Post('restaurants/:restaurantId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU12-012: Agregar un restaurante a la lista de favoritos',
    description: 'Guarda un restaurante saludable en la lista de favoritos del usuario.',
  })
  @ApiParam({ name: 'restaurantId', example: 'rest-1', description: 'ID del restaurante' })
  @ApiResponse({ status: 201, description: 'Restaurante agregado a favoritos' })
  @ApiResponse({ status: 404, description: 'Restaurante no encontrado' })
  async addFavoriteRestaurant(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.favoritesService.addFavorite(user.id, 'RESTAURANT', restaurantId);
  }

  @Delete('restaurants/:restaurantId')
  @ApiOperation({
    summary: 'HE-HU12-012: Remover un restaurante de la lista de favoritos',
    description: 'Elimina un restaurante de los favoritos del usuario.',
  })
  @ApiParam({ name: 'restaurantId', example: 'rest-1', description: 'ID del restaurante' })
  @ApiResponse({ status: 200, description: 'Restaurante eliminado de favoritos' })
  @ApiResponse({ status: 404, description: 'Elemento no encontrado en favoritos' })
  async removeFavoriteRestaurant(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.favoritesService.removeFavorite(user.id, 'RESTAURANT', restaurantId);
  }

  @Post('menus/:menuId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU12-012: Agregar un menú o plato saludable a la lista de favoritos',
    description: 'Guarda un plato específico en la lista de favoritos del usuario.',
  })
  @ApiParam({ name: 'menuId', example: 'menu-1', description: 'ID del plato' })
  @ApiResponse({ status: 201, description: 'Plato agregado a favoritos' })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async addFavoriteMenu(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('menuId') menuId: string,
  ) {
    return this.favoritesService.addFavorite(user.id, 'MENU_ITEM', menuId);
  }

  @Delete('menus/:menuId')
  @ApiOperation({
    summary: 'HE-HU12-012: Remover un plato de la lista de favoritos',
    description: 'Elimina un plato de los favoritos del usuario.',
  })
  @ApiParam({ name: 'menuId', example: 'menu-1', description: 'ID del plato' })
  @ApiResponse({ status: 200, description: 'Plato eliminado de favoritos' })
  @ApiResponse({ status: 404, description: 'Elemento no encontrado en favoritos' })
  async removeFavoriteMenu(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('menuId') menuId: string,
  ) {
    return this.favoritesService.removeFavorite(user.id, 'MENU_ITEM', menuId);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Verificar si un restaurante o plato está marcado como favorito',
    description: 'Retorna un booleano indicando si el elemento consultado es favorito del usuario actual.',
  })
  @ApiQuery({ name: 'type', enum: ['RESTAURANT', 'MENU_ITEM'] })
  @ApiQuery({ name: 'targetId', example: 'rest-1' })
  @ApiResponse({ status: 200, description: 'Estado de favorito verificado' })
  async checkFavoriteStatus(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query('type') type: FavoriteType,
    @Query('targetId') targetId: string,
  ) {
    return this.favoritesService.isFavorite(user.id, type, targetId);
  }
}

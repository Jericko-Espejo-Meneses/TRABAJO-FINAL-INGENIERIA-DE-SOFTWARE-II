import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Sprint 8: Favoritos y Productos Detallados')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Public()
  @Get('allergens')
  @ApiOperation({
    summary: 'Listar todos los alérgenos presentes en el catálogo de platos',
    description: 'Permite identificar alérgenos comunes (Gluten, Lácteos, Soja, Frutos secos, etc.) para filtros de seguridad alimentaria.',
  })
  @ApiResponse({ status: 200, description: 'Lista de alérgenos identificados' })
  async getAllergensList() {
    return this.menusService.getAllergensList();
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todos los platos saludables del catálogo',
    description: 'Retorna todos los platos con su información nutricional.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de menús' })
  async findAll() {
    return this.menusService.findAll();
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({
    summary: 'Listar platos de un restaurante específico',
    description: 'Retorna los platos ofrecidos por un restaurante.',
  })
  @ApiParam({ name: 'restaurantId', example: 'rest-1', description: 'ID del restaurante' })
  @ApiResponse({ status: 200, description: 'Menú del restaurante' })
  async findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.menusService.findByRestaurant(restaurantId);
  }

  @Public()
  @Get(':id/nutritional-detail')
  @ApiOperation({
    summary: 'HE-HU14-014: Visualizar el detalle nutricional completo y descripción del menú',
    description: 'Devuelve la tabla nutricional completa (macronutrientes, micronutrientes, NutriScore, índice glucémico), ingredientes, alérgenos y método de preparación.',
  })
  @ApiParam({ name: 'id', example: 'menu-1', description: 'ID único del plato' })
  @ApiResponse({ status: 200, description: 'Detalle nutricional exhaustivo del plato' })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async getNutritionalDetail(@Param('id') id: string) {
    return this.menusService.getNutritionalDetail(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener información básica de un plato',
    description: 'Retorna los datos generales del plato de menú.',
  })
  @ApiParam({ name: 'id', example: 'menu-1', description: 'ID del plato' })
  @ApiResponse({ status: 200, description: 'Información del plato' })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async findById(@Param('id') id: string) {
    return this.menusService.findById(id);
  }
}

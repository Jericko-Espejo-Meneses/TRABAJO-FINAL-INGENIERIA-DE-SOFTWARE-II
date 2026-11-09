import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { SearchRestaurantsDto } from './dto/search-restaurants.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Sprint 2: Exploración y Recomendaciones')
@Controller(['restaurants', 'restaurantes'])
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'HE-HU2-002: Buscar restaurantes con opciones saludables',
    description: 'Permite buscar y filtrar restaurantes según dietas (vegano, keto, sin gluten), calificación, tiempo de entrega y certificación saludable.',
  })
  @ApiResponse({ status: 200, description: 'Lista filtrada de restaurantes saludables' })
  async search(@Query() queryDto: SearchRestaurantsDto) {
    return this.restaurantsService.search(queryDto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({
    summary: 'Obtener categorías y etiquetas dietéticas disponibles',
    description: 'Retorna las categorías saludables y etiquetas disponibles para la búsqueda.',
  })
  @ApiResponse({ status: 200, description: 'Categorías y etiquetas dietéticas' })
  async getCategories() {
    return this.restaurantsService.getCategories();
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todos los restaurantes saludables disponibles',
    description: 'Retorna el catálogo completo de restaurantes asociados a HealthExpress o filtrados por query params.',
  })
  @ApiResponse({ status: 200, description: 'Lista general de restaurantes' })
  async findAll(@Query() queryDto: SearchRestaurantsDto) {
    return this.restaurantsService.findAll(queryDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de restaurante y su catálogo de menús saludables',
    description: 'Retorna la información del restaurante junto con sus platos y especificaciones nutricionales.',
  })
  @ApiParam({ name: 'id', example: 'rest-1', description: 'ID único del restaurante' })
  @ApiResponse({ status: 200, description: 'Detalle del restaurante y sus menús' })
  @ApiResponse({ status: 404, description: 'Restaurante no encontrado' })
  async findById(@Param('id') id: string) {
    return this.restaurantsService.findById(id);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 3: Exploración y Recomendaciones')
@Controller(['recommendations', 'recomendaciones'])
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Public()
  @Get(['menus', ''])
  @ApiOperation({
    summary: 'HE-HU3-003: Recibir recomendaciones de menús saludables',
    description: 'Motor inteligente de recomendación basado en objetivos de salud, límites calóricos, proteínas y dietas.',
  })
  @ApiResponse({ status: 200, description: 'Lista de menús recomendados' })
  async getRecommendations(@Query() query: RecommendationQueryDto) {
    return this.recommendationsService.getRecommendations(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({
    summary: 'Recomendaciones destacadas del día por nutricionistas',
    description: 'Retorna los platos más saludables, balanceados y mejor valorados por la comunidad.',
  })
  @ApiResponse({ status: 200, description: 'Menús destacados del día' })
  async getFeatured() {
    return this.recommendationsService.getFeaturedRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('personalized')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'HE-HU3-003: Recomendaciones personalizadas según el perfil del usuario',
    description: 'Genera recomendaciones automáticas acordes a las metas y restricciones del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Menús recomendados según el perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPersonalized(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.recommendationsService.getPersonalizedRecommendations(user.id);
  }
}

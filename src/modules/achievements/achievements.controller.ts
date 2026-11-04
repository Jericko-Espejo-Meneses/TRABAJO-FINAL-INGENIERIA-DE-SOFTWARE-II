import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 6: Notificaciones y Logros')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar catálogo de todos los logros e insignias disponibles',
    description: 'Retorna las metas e insignias que los usuarios pueden desbloquear comiendo sano y donando.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de logros' })
  async getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-progress')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'HE-HU7-007: Visualizar mis logros, insignias desbloqueadas y progreso',
    description: 'Devuelve el estado de avance del usuario en cada insignia de la comunidad.',
  })
  @ApiResponse({ status: 200, description: 'Progreso de insignias del usuario' })
  async getMyProgress(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.achievementsService.getUserAchievements(user.id);
  }
}

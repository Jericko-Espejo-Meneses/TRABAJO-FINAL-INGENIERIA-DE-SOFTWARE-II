import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 6: Notificaciones y Logros')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'HE-HU7-007: Recibir y listar notificaciones del usuario (promociones, logros, estados)',
    description: 'Devuelve todas las notificaciones recibidas por el usuario ordenadas cronológicamente.',
  })
  @ApiResponse({ status: 200, description: 'Listado de notificaciones' })
  async getNotifications(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marcar una notificación como leída',
    description: 'Actualiza el estado de lectura de una notificación específica.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación actualizada' })
  async markAsRead(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones pendientes del usuario como leídas.',
  })
  @ApiResponse({ status: 200, description: 'Notificaciones actualizadas' })
  async markAllAsRead(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}

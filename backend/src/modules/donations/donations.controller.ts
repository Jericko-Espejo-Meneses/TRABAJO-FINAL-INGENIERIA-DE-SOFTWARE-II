import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 4 y 5: Donación Automática e Impacto Social')
@Controller(['donations', 'donaciones'])
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Public()
  @Get('foundations')
  @ApiOperation({
    summary: 'Listar fundaciones y ONGs aliadas beneficiarias',
    description: 'Retorna las instituciones benéficas donde se destina la donación automática del porcentaje de las compras.',
  })
  @ApiResponse({ status: 200, description: 'Lista de fundaciones beneficiarias' })
  async getFoundations() {
    return this.donationsService.getFoundations();
  }

  @UseGuards(JwtAuthGuard)
  @Get(['impact', 'resumen'])
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'HE-HU6-006: Visualizar resumen de impacto social de las donaciones del usuario',
    description: 'Retorna el total de dinero donado automáticamente a través de sus compras, platos equivalentes aportados y causas beneficiadas.',
  })
  @ApiResponse({ status: 200, description: 'Resumen de impacto social del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserImpact(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    const impact = await this.donationsService.getUserImpact(user.id);
    return {
      ...impact,
      total: impact.totalDonated,
      count: impact.totalDonationCount,
      cantidad: impact.totalDonationCount,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'HE-HU6-006: Historial de donaciones generadas por pedido',
    description: 'Lista cada donación asociada a un pedido realizado por el usuario.',
  })
  @ApiResponse({ status: 200, description: 'Historial de donaciones del usuario' })
  async getUserDonations(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.donationsService.getUserDonations(user.id);
  }
}

import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 7: Perfil y Personalización')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller(['profile', 'usuarios/me'])
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'HE-HU11-011: Obtener perfil del usuario (datos, preferencias y direcciones)',
    description: 'Devuelve información personal, preferencias dietéticas, metas y direcciones guardadas.',
  })
  @ApiResponse({ status: 200, description: 'Perfil de usuario obtenido' })
  async getProfile(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.profileService.getProfile(user.id);
  }

  @Get('preferencias')
  @ApiOperation({
    summary: 'Obtener preferencias dietéticas del usuario',
  })
  @ApiResponse({ status: 200, description: 'Preferencias dietéticas' })
  async getPreferences(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    const prof = await this.profileService.getProfile(user.id);
    return prof.dietaryPreferences ?? [];
  }

  @Put('preferencias')
  @ApiOperation({
    summary: 'Actualizar preferencias dietéticas del usuario',
  })
  @ApiResponse({ status: 200, description: 'Preferencias actualizadas' })
  async updatePreferences(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() body: string[] | { dietaryPreferences: string[] },
  ) {
    const dietaryPreferences = Array.isArray(body) ? body : body.dietaryPreferences;
    return this.profileService.updateProfile(user.id, { dietaryPreferences });
  }

  @Patch()
  @ApiOperation({
    summary: 'HE-HU11-011: Editar perfil (datos personales y preferencias)',
    description: 'Permite actualizar nombre, teléfono, preferencias de alimentación (dietaryPreferences) y metas de salud (healthGoals).',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  async updateProfile(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Post('addresses')
  @ApiOperation({
    summary: 'Agregar una dirección de entrega guardada',
    description: 'Permite registrar una nueva dirección (Casa, Oficina, etc.) con sus referencias.',
  })
  @ApiResponse({ status: 201, description: 'Dirección agregada al perfil' })
  async addAddress(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: AddAddressDto,
  ) {
    return this.profileService.addAddress(user.id, dto);
  }

  @Delete('addresses/:addressId')
  @ApiOperation({
    summary: 'Eliminar una dirección de entrega guardada',
    description: 'Elimina una dirección del perfil del usuario.',
  })
  @ApiParam({ name: 'addressId', description: 'ID de la dirección a eliminar' })
  @ApiResponse({ status: 200, description: 'Dirección eliminada' })
  async deleteAddress(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Param('addressId') addressId: string,
  ) {
    return this.profileService.deleteAddress(user.id, addressId);
  }
}

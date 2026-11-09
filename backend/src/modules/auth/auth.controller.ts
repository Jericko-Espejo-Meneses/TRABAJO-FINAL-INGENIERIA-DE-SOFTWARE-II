import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Sprint 1: Registro y Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU1-001: Registrarse con correo electrónico',
    description: 'Permite a un nuevo usuario registrar una cuenta en HealthExpress usando su correo y contraseña.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente con token JWT' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya se encuentra registrado' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('social-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HE-HU1-001: Registrarse con redes sociales (Google, Facebook, Apple)',
    description: 'Permite registrarse utilizando credenciales proporcionadas por proveedores sociales.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado y autenticado vía red social' })
  async socialRegister(@Body() dto: SocialAuthDto) {
    return this.authService.socialAuth(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HE-HU10-010: Iniciar sesión con correo electrónico',
    description: 'Autentica a un usuario con sus credenciales registradas y retorna el token JWT de acceso.',
  })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso, retorna JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HE-HU10-010: Iniciar sesión con redes sociales (Google, Facebook, Apple)',
    description: 'Autentica a un usuario mediante su proveedor de red social y retorna el token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Inicio de sesión social exitoso, retorna JWT' })
  async socialLogin(@Body() dto: SocialAuthDto) {
    return this.authService.socialAuth(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna los datos del usuario autenticado a partir del token Bearer JWT.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario recuperado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido o expirado' })
  async getProfile(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return user;
  }
}

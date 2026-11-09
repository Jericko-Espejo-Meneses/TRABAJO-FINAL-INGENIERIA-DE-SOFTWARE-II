import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { User } from '../users/entities/user.entity';

export interface AuthResponse {
  accessToken: string;
  token?: string;
  tokenType: string;
  user: Omit<User, 'passwordHash'>;
  usuario?: any;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * HE-HU1-001: Registro con correo electrónico y contraseña
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email || dto.correo;
    const password = dto.password || dto.contrasena;
    const fullName = dto.fullName || dto.nombre || '';
    const phone = dto.phone || dto.telefono;
    const address = dto.address || dto.direccion;

    if (!email || !password) {
      throw new ConflictException('El correo y la contraseña son requeridos');
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta registrada con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      fullName: fullName || email.split('@')[0],
      passwordHash,
      phone,
      provider: 'email',
      dietaryPreferences: dto.dietaryPreferences || [],
      healthGoals: dto.healthGoals || [],
      addresses: address
        ? [
            {
              id: `addr-${Date.now()}`,
              label: 'Principal',
              street: address,
              city: 'Lima',
              isDefault: true,
            },
          ]
        : [],
    });

    return this.generateAuthResponse(user);
  }

  /**
   * HE-HU10-010: Inicio de sesión con correo electrónico y contraseña
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email || dto.correo;
    const password = dto.password || dto.contrasena;

    if (!email || !password) {
      throw new UnauthorizedException('Credenciales inválidas (correo o contraseña incorrectos)');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (correo o contraseña incorrectos)');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        `Esta cuenta fue creada mediante inicio de sesión social (${user.provider}). Inicie sesión con esa red social.`,
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas (correo o contraseña incorrectos)');
    }

    return this.generateAuthResponse(user);
  }

  /**
   * HE-HU1-001 & HE-HU10-010: Registro e inicio de sesión unificado con Redes Sociales (Google, Facebook, Apple)
   */
  async socialAuth(dto: SocialAuthDto): Promise<AuthResponse> {
    // 1. Check if user already exists by providerId
    let user = await this.usersService.findByProvider(dto.provider, dto.providerId);

    // 2. If not found by provider, check by email
    if (!user) {
      const existingByEmail = await this.usersService.findByEmail(dto.email);
      if (existingByEmail) {
        // Link social provider to existing account
        user = await this.usersService.update(existingByEmail.id, {
          provider: dto.provider,
          providerId: dto.providerId,
          avatarUrl: dto.avatarUrl || existingByEmail.avatarUrl,
        });
      } else {
        // Create new account via social auth
        user = await this.usersService.create({
          email: dto.email,
          fullName: dto.fullName,
          provider: dto.provider,
          providerId: dto.providerId,
          avatarUrl: dto.avatarUrl,
          dietaryPreferences: [],
          healthGoals: [],
        });
      }
    }

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      provider: user.provider,
    };

    const accessToken = this.jwtService.sign(payload);
    const safeUser = this.usersService.sanitize(user);

    return {
      accessToken,
      token: accessToken,
      tokenType: 'Bearer',
      user: safeUser,
      usuario: {
        idUsuario: safeUser.id,
        id: safeUser.id,
        correo: safeUser.email,
        email: safeUser.email,
        nombre: safeUser.fullName,
        name: safeUser.fullName,
        direccion: safeUser.addresses?.[0]?.street || '',
        telefono: safeUser.phone || '',
        preferencias: safeUser.dietaryPreferences || [],
        biografia: '',
      },
    };
  }
}

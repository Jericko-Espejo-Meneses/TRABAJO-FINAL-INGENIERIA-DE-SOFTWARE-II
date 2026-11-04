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
  tokenType: string;
  user: Omit<User, 'passwordHash'>;
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
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta registrada con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      phone: dto.phone,
      provider: 'email',
      dietaryPreferences: dto.dietaryPreferences || [],
      healthGoals: dto.healthGoals || [],
      addresses: dto.address
        ? [
            {
              id: `addr-${Date.now()}`,
              label: 'Principal',
              street: dto.address,
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
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (correo o contraseña incorrectos)');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        `Esta cuenta fue creada mediante inicio de sesión social (${user.provider}). Inicie sesión con esa red social.`,
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
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
        // Register new user via social provider
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

    return {
      accessToken,
      tokenType: 'Bearer',
      user: this.usersService.sanitize(user),
    };
  }
}

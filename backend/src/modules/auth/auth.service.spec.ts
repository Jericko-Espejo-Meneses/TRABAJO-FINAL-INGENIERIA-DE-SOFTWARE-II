import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../../database/database.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService (Sprint 1: HE-HU1-001 & HE-HU10-010)', () => {
  let authService: AuthService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        DatabaseService,
        {
          provide: PrismaService,
          useValue: {
            connected: false,
            user: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  describe('HE-HU1-001: Registro con correo y contraseña', () => {
    it('debe registrar un nuevo usuario exitosamente con hash y token', async () => {
      const result = await authService.register({
        email: 'nuevo.usuario@test.com',
        password: 'Password123!',
        fullName: 'Nuevo Usuario',
        dietaryPreferences: ['vegano'],
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('nuevo.usuario@test.com');
      expect(result.user.fullName).toBe('Nuevo Usuario');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('debe lanzar ConflictException si el correo ya existe', async () => {
      await expect(
        authService.register({
          email: 'usuario.demo@healthexpress.com',
          password: 'Password123!',
          fullName: 'Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('HE-HU1-001 & HE-HU10-010: Registro e inicio de sesión social', () => {
    it('debe registrar y autenticar con cuenta de Google', async () => {
      const result = await authService.socialAuth({
        provider: 'google',
        providerId: 'google-uid-12345',
        email: 'social.user@gmail.com',
        fullName: 'Social User',
        avatarUrl: 'https://avatar.url',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.provider).toBe('google');
      expect(result.user.providerId).toBe('google-uid-12345');
    });
  });

  describe('HE-HU10-010: Inicio de sesión con correo y contraseña', () => {
    it('debe iniciar sesión con credenciales correctas', async () => {
      const result = await authService.login({
        email: 'usuario.demo@healthexpress.com',
        password: 'Password123!',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('usuario.demo@healthexpress.com');
    });

    it('debe rechazar con UnauthorizedException si la contraseña es incorrecta', async () => {
      await expect(
        authService.login({
          email: 'usuario.demo@healthexpress.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

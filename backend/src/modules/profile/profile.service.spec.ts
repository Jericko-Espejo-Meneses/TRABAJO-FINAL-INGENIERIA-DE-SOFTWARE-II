import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../../database/database.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('ProfileService (Sprint 7: HE-HU11-011)', () => {
  let service: ProfileService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        UsersService,
        DatabaseService,
        {
          provide: PrismaService,
          useValue: {
            connected: false,
            user: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU11-011: debe obtener el perfil completo y preferencias del usuario', async () => {
    const profile = await service.getProfile('user-demo-1');
    expect(profile).toBeDefined();
    expect(profile.email).toBe('usuario.demo@healthexpress.com');
    expect(profile.dietaryPreferences).toContain('vegetariano');
  });

  it('HE-HU11-011: debe permitir editar datos personales y preferencias nutricionales', async () => {
    const updated = await service.updateProfile('user-demo-1', {
      fullName: 'Carlos Mendoza Actualizado',
      dietaryPreferences: ['vegano', 'sin gluten'],
      healthGoals: ['weight_loss'],
    });

    expect(updated.fullName).toBe('Carlos Mendoza Actualizado');
    expect(updated.dietaryPreferences).toEqual(['vegano', 'sin gluten']);
    expect(updated.healthGoals).toEqual(['weight_loss']);
  });

  it('HE-HU11-011: debe agregar una nueva dirección de entrega guardada', async () => {
    const addresses = await service.addAddress('user-demo-1', {
      label: 'Gimnasio',
      street: 'Av. Benavides 2050',
      city: 'Miraflores',
      reference: 'SmartFit',
      isDefault: false,
    });

    expect(addresses.length).toBeGreaterThan(2);
    expect(addresses.some((a) => a.label === 'Gimnasio')).toBe(true);
  });
});

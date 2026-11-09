import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { User, AuthProvider } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const normalized = email.toLowerCase().trim();
    // 1. Check memory cache
    for (const user of this.db.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }

    // 2. Fallback to Prisma database
    try {
      if (this.prisma.connected) {
        const dbUser = await this.prisma.user.findUnique({
          where: { email: normalized },
          include: { addresses: true },
        });
        if (dbUser) {
          const userEntity: User = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            passwordHash: dbUser.passwordHash,
            phone: dbUser.phone || undefined,
            provider: (dbUser.provider as AuthProvider) || 'email',
            providerId: dbUser.providerId || undefined,
            avatarUrl: dbUser.avatarUrl || undefined,
            dietaryPreferences: JSON.parse(dbUser.dietaryPreferences || '[]'),
            healthGoals: JSON.parse(dbUser.healthGoals || '[]'),
            addresses: dbUser.addresses?.map((a: any) => ({
              id: a.id,
              label: a.label,
              street: a.street,
              city: a.city,
              reference: a.reference,
              isDefault: a.isDefault,
            })) || [],
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
          this.db.users.set(userEntity.id, userEntity);
          return userEntity;
        }
      }
    } catch {
      // resilient fallback
    }

    return undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const memoryUser = this.db.users.get(id);
    if (memoryUser) return memoryUser;

    try {
      if (this.prisma.connected) {
        const dbUser = await this.prisma.user.findUnique({
          where: { id },
          include: { addresses: true },
        });
        if (dbUser) {
          const userEntity: User = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            passwordHash: dbUser.passwordHash,
            phone: dbUser.phone || undefined,
            provider: (dbUser.provider as AuthProvider) || 'email',
            providerId: dbUser.providerId || undefined,
            avatarUrl: dbUser.avatarUrl || undefined,
            dietaryPreferences: JSON.parse(dbUser.dietaryPreferences || '[]'),
            healthGoals: JSON.parse(dbUser.healthGoals || '[]'),
            addresses: dbUser.addresses?.map((a: any) => ({
              id: a.id,
              label: a.label,
              street: a.street,
              city: a.city,
              reference: a.reference,
              isDefault: a.isDefault,
            })) || [],
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
          this.db.users.set(userEntity.id, userEntity);
          return userEntity;
        }
      }
    } catch {
      // resilient fallback
    }

    return undefined;
  }

  async findByProvider(provider: string, providerId: string): Promise<User | undefined> {
    for (const user of this.db.users.values()) {
      if (user.provider === provider && user.providerId === providerId) {
        return user;
      }
    }
    return undefined;
  }

  async create(data: Partial<User>): Promise<User> {
    const user: User = {
      id: data.id || uuidv4(),
      email: data.email?.toLowerCase().trim() || '',
      fullName: data.fullName || '',
      passwordHash: data.passwordHash,
      phone: data.phone,
      provider: data.provider || 'email',
      providerId: data.providerId,
      avatarUrl: data.avatarUrl,
      dietaryPreferences: data.dietaryPreferences || [],
      healthGoals: data.healthGoals || [],
      addresses: data.addresses || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.users.set(user.id, user);

    try {
      if (this.prisma.connected) {
        await this.prisma.user.upsert({
          where: { email: user.email },
          update: {
            fullName: user.fullName,
            phone: user.phone,
            passwordHash: user.passwordHash,
          },
          create: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            passwordHash: user.passwordHash,
            phone: user.phone,
            provider: user.provider,
            providerId: user.providerId,
            avatarUrl: user.avatarUrl,
            dietaryPreferences: JSON.stringify(user.dietaryPreferences),
            healthGoals: JSON.stringify(user.healthGoals),
          },
        });
      }
    } catch {
      // resilient
    }

    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const updated: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    this.db.users.set(id, updated);

    try {
      if (this.prisma.connected) {
        await this.prisma.user.update({
          where: { id },
          data: {
            fullName: updated.fullName,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl,
            dietaryPreferences: JSON.stringify(updated.dietaryPreferences || []),
            healthGoals: JSON.stringify(updated.healthGoals || []),
          },
        });
      }
    } catch {
      // resilient
    }

    return updated;
  }

  sanitize(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

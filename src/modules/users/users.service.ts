import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.db.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.db.users.get(id);
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
      id: uuidv4(),
      email: data.email?.toLowerCase().trim() || '',
      fullName: data.fullName || '',
      passwordHash: data.passwordHash,
      phone: data.phone,
      provider: data.provider || 'email',
      providerId: data.providerId,
      avatarUrl: data.avatarUrl,
      dietaryPreferences: data.dietaryPreferences || [],
      healthGoals: data.healthGoals || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.users.set(user.id, user);
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
    return updated;
  }

  sanitize(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

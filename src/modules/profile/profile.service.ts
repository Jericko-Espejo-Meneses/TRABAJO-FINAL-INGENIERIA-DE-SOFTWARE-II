import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { User, UserAddress } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfileService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * HE-HU11-011: Obtener perfil completo del usuario con preferencias y direcciones
   */
  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    return this.usersService.sanitize(user);
  }

  /**
   * HE-HU11-011: Editar perfil (datos personales, preferencias dietéticas y objetivos)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const updatedUser = await this.usersService.update(userId, {
      fullName: dto.fullName ?? user.fullName,
      phone: dto.phone ?? user.phone,
      avatarUrl: dto.avatarUrl ?? user.avatarUrl,
      dietaryPreferences: dto.dietaryPreferences ?? user.dietaryPreferences,
      healthGoals: dto.healthGoals ?? user.healthGoals,
    });

    return this.usersService.sanitize(updatedUser);
  }

  /**
   * HE-HU11-011: Agregar una nueva dirección de entrega al perfil
   */
  async addAddress(userId: string, dto: AddAddressDto): Promise<UserAddress[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const addresses = user.addresses ? [...user.addresses] : [];

    // Si la nueva es default, quitar default de las anteriores
    if (dto.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }

    const newAddress: UserAddress = {
      id: `addr-${uuidv4().substring(0, 6)}`,
      label: dto.label,
      street: dto.street,
      city: dto.city,
      reference: dto.reference,
      isDefault: dto.isDefault ?? (addresses.length === 0),
    };

    addresses.push(newAddress);
    await this.usersService.update(userId, { addresses });
    return addresses;
  }

  /**
   * HE-HU11-011: Eliminar una dirección de entrega
   */
  async deleteAddress(userId: string, addressId: string): Promise<UserAddress[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const addresses = (user.addresses || []).filter((a) => a.id !== addressId);
    await this.usersService.update(userId, { addresses });
    return addresses;
  }
}

export type AuthProvider = 'email' | 'google' | 'facebook' | 'apple';

export interface UserAddress {
  id: string;
  label: string; // ej. 'Casa', 'Trabajo'
  street: string;
  city: string;
  reference?: string;
  isDefault: boolean;
}

export class User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  phone?: string;
  provider: AuthProvider;
  providerId?: string;
  avatarUrl?: string;
  dietaryPreferences: string[];
  healthGoals: string[];
  addresses?: UserAddress[];
  createdAt: Date;
  updatedAt: Date;
}

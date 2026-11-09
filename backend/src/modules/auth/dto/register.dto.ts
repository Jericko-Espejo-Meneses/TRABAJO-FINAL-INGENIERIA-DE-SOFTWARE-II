import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsArray } from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'juan.perez@example.com', description: 'Correo electrónico del usuario' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com', description: 'Alias en español' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo?: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Contraseña segura (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Alias en español' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Alias en español' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Número de teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Alias en español' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    example: ['vegetariano', 'sin gluten'],
    description: 'Preferencias dietéticas iniciales del usuario',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  dietaryPreferences?: string[];

  @ApiPropertyOptional({
    example: ['weight_loss', 'detox'],
    description: 'Objetivos de salud iniciales',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  healthGoals?: string[];

  @ApiPropertyOptional({
    example: 'Av. Larco 123, Miraflores',
    description: 'Dirección de entrega inicial del usuario',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Av. Larco 123, Miraflores',
    description: 'Alias en español'
  })
  @IsOptional()
  @IsString()
  direccion?: string;
}

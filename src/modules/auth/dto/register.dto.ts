import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña segura (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Número de teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

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
}

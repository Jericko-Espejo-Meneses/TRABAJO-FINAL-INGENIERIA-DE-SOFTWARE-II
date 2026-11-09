import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Carlos Mendoza Ramos', description: 'Nombre completo actualizado' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Número de teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', description: 'URL de foto de perfil' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: ['vegano', 'sin gluten', 'keto'],
    description: 'Preferencias o restricciones dietéticas del usuario',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  dietaryPreferences?: string[];

  @ApiPropertyOptional({
    example: ['weight_loss', 'detox'],
    description: 'Objetivos de salud para personalizar recomendaciones',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  healthGoals?: string[];
}

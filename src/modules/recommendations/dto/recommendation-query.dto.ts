import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class RecommendationQueryDto {
  @ApiPropertyOptional({
    example: 'weight_loss',
    enum: ['weight_loss', 'muscle_gain', 'keto', 'detox', 'balanced'],
    description: 'Objetivo de salud para enfocar la recomendación (pérdida de peso, ganancia muscular, cetogénica, desintoxicación o balanceado)',
  })
  @IsOptional()
  @IsIn(['weight_loss', 'muscle_gain', 'keto', 'detox', 'balanced'], {
    message: 'healthGoal debe ser: weight_loss, muscle_gain, keto, detox o balanced',
  })
  healthGoal?: 'weight_loss' | 'muscle_gain' | 'keto' | 'detox' | 'balanced';

  @ApiPropertyOptional({
    example: 'vegano',
    description: 'Preferencia o restricción dietética (ej. vegano, vegetariano, sin gluten, alto en proteina)',
  })
  @IsOptional()
  @IsString()
  dietaryTag?: string;

  @ApiPropertyOptional({
    example: 450,
    description: 'Límite máximo de calorías por porción',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  maxCalories?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'Mínimo de gramos de proteína requeridos',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProtein?: number;

  @ApiPropertyOptional({
    example: 35.0,
    description: 'Precio máximo por plato',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Cantidad máxima de recomendaciones a devolver',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

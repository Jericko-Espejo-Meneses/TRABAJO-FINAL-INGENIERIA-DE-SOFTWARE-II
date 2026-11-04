import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchRestaurantsDto {
  @ApiPropertyOptional({
    example: 'bowls',
    description: 'Término de búsqueda en nombre, descripción o especialidad',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Alias para query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'Bowls & Ensaladas',
    description: 'Filtrar por categoría de comida saludable',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Alias para category' })
  @IsOptional()
  @IsString()
  tipoComida?: string;

  @ApiPropertyOptional({
    example: 'vegano',
    description: 'Filtrar por etiqueta dietética saludable (e.g. vegano, vegetariano, keto, sin gluten, organico)',
  })
  @IsOptional()
  @IsString()
  dietaryTag?: string;

  @ApiPropertyOptional({ description: 'Alias para dietaryTag' })
  @IsOptional()
  tags?: any;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Calificación mínima (1 a 5 estrellas)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Tiempo máximo de entrega estimado en minutos',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  maxDeliveryTime?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar solo restaurantes con Certificación Saludable HealthExpress',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isHealthyCertified?: boolean;

  @ApiPropertyOptional({
    example: 'rating',
    enum: ['rating', 'deliveryTime', 'name'],
    description: 'Criterio de ordenación de los resultados',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'deliveryTime' | 'name';
}

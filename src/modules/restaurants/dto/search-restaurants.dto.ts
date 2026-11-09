import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean, IsArray } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filtros combinados con AND. Acepta tags repetidos o separados por comas.', type: [String] })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | string;

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

  @ApiPropertyOptional({
    example: -12.0464,
    description: 'Latitud del usuario (geolocalización del navegador)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: -77.0428,
    description: 'Longitud del usuario (geolocalización del navegador)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Distancia máxima en km desde la ubicación del usuario',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanciaMax?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'Nueva cantidad del producto. Si se envía 0, se eliminará el ítem del carrito.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  quantity?: number;

  @ApiPropertyOptional({
    example: 'Sin sal añadida',
    description: 'Actualización de instrucciones especiales',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

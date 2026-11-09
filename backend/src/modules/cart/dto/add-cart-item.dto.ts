import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @ApiProperty({
    example: 'menu-1',
    description: 'Identificador único del plato o producto a añadir',
  })
  @IsString()
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  menuItemId: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad de unidades del producto',
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima a agregar es 1' })
  quantity: number = 1;

  @ApiPropertyOptional({
    example: 'Aderezo aparte, por favor',
    description: 'Instrucciones especiales para la preparación del plato saludable',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
